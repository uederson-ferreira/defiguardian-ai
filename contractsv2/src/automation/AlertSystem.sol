// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../core/RiskOracle.sol";
import "../core/RiskRegistry.sol";
import "../core/PortfolioRiskAnalyzer.sol";

// ===== LIBRARIES TO REDUCE SIZE =====

/**
 * @title AlertTypes
 * @dev Library with types and structures
 */
library AlertTypes {
    enum AlertType {
        RISK_THRESHOLD,
        LIQUIDATION_WARNING,
        PORTFOLIO_HEALTH,
        PRICE_VOLATILITY,
        PROTOCOL_UPGRADE,
        GOVERNANCE_CHANGE
    }

    enum AlertPriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    struct Alert {
        uint256 id;
        address user;
        AlertType alertType;
        AlertPriority priority;
        address protocol;
        string message;
        uint256 riskLevel;
        uint256 threshold;
        uint256 timestamp;
        bool isActive;
        bool isResolved;
    }

    struct AlertSubscription {
        address user;
        AlertType alertType;
        address protocol;
        uint256 threshold;
        bool isActive;
        uint256 lastTriggered;
        uint256 cooldownPeriod;
    }

    struct UserPreferences {
        bool enableEmailAlerts;
        bool enablePushNotifications;
        bool enableSMSAlerts;
        uint256 minimumPriority;
        uint256 globalCooldown;
    }

    struct ProcessingContext {
        address user;
        uint256 subscriptionIndex;
        uint256 currentRisk;
        uint256 threshold;
        AlertPriority priority;
    }

    struct AlertCounters {
        uint64 activeAlertsCount;
        uint64 totalAlertsCreated;
        uint64 totalAlertsResolved;
        uint64 reserved;
    }
}

/**
 * @title AlertValidation
 * @dev Library for validations
 */
library AlertValidation {
    error ThresholdTooHigh(uint256 threshold);
    error TooManySubscriptions(uint256 current, uint256 max);
    error CooldownTooShort(uint256 cooldown);
    error InvalidPriorityLevel(uint256 priority);

    uint256 public constant MAX_THRESHOLD = 10000;
    uint256 public constant MAX_SUBSCRIPTIONS_PER_USER = 50;
    uint256 public constant MIN_COOLDOWN = 10 minutes;

    function validateSubscriptionParams(uint256 _threshold, uint256 _currentCount) internal pure {
        if (_threshold > MAX_THRESHOLD) {
            revert ThresholdTooHigh(_threshold);
        }
        if (_currentCount >= MAX_SUBSCRIPTIONS_PER_USER) {
            revert TooManySubscriptions(_currentCount, MAX_SUBSCRIPTIONS_PER_USER);
        }
    }

    function validateProtocol(address _protocol) internal view {
        if (_protocol != address(0)) {
            uint256 size;
            assembly { size := extcodesize(_protocol) }
            require(size > 0, "Protocol is not a contract");
        }
    }

    function validateUpdateParams(uint256 _threshold, uint256 _cooldown) internal pure {
        if (_threshold > MAX_THRESHOLD) {
            revert ThresholdTooHigh(_threshold);
        }
        if (_cooldown < MIN_COOLDOWN) {
            revert CooldownTooShort(_cooldown);
        }
    }

    function validateUserPreferences(uint256 _minimumPriority, uint256 _globalCooldown) internal pure {
        if (_minimumPriority > uint256(AlertTypes.AlertPriority.CRITICAL)) {
            revert InvalidPriorityLevel(_minimumPriority);
        }
        if (_globalCooldown < 5 minutes) {
            revert CooldownTooShort(_globalCooldown);
        }
    }
}

/**
 * @title AlertProcessing
 * @dev Library for alert processing
 */
library AlertProcessing {
    using AlertTypes for *;

    function calculatePriority(uint256 _risk, uint256 _threshold) internal pure returns (AlertTypes.AlertPriority) {
        if (_risk <= _threshold) return AlertTypes.AlertPriority.LOW;
        
        unchecked {
            uint256 excess = _risk - _threshold;
            uint256 ratio = (excess * 100) / _threshold;

            if (ratio >= 50) return AlertTypes.AlertPriority.CRITICAL;
            if (ratio >= 25) return AlertTypes.AlertPriority.HIGH;
            if (ratio >= 10) return AlertTypes.AlertPriority.MEDIUM;
            return AlertTypes.AlertPriority.LOW;
        }
    }

    function shouldSkipSubscription(AlertTypes.AlertSubscription memory _sub) internal view returns (bool) {
        return !_sub.isActive || block.timestamp < _sub.lastTriggered + _sub.cooldownPeriod;
    }

    function checkUserPreferences(
        AlertTypes.UserPreferences memory _prefs, 
        AlertTypes.AlertPriority _priority
    ) internal pure returns (bool) {
        return _prefs.globalCooldown == 0 || uint256(_priority) >= _prefs.minimumPriority;
    }
}

/**
 * @title MessageFormatter
 * @dev Library for message formatting
 */
library MessageFormatter {
    function formatRiskMessage(uint256 _risk, uint256 _threshold) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "Risk threshold exceeded. Current: ",
            uint2str(_risk / 100),
            "%, Threshold: ",
            uint2str(_threshold / 100),
            "%"
        ));
    }

    function formatLiquidationMessage(uint256 _risk) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "LIQUIDATION WARNING: Portfolio risk at ",
            uint2str(_risk / 100),
            "%. Reduce exposure immediately."
        ));
    }

    function formatPortfolioMessage(uint256 _risk, uint256 _diversification) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "Portfolio health alert: Risk ",
            uint2str(_risk / 100),
            "%, Diversification ",
            uint2str(_diversification / 100),
            "%"
        ));
    }

    function formatVolatilityMessage(uint256 _volatility) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "High volatility detected. Risk: ",
            uint2str(_volatility / 100),
            "%"
        ));
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        
        return string(bstr);
    }
}

// ===== MAIN CONTRACT (REDUCED) =====

/**
 * @title AlertSystem
 * @dev Modular alert system optimized for size
 */
contract AlertSystem is Ownable(msg.sender), ReentrancyGuard, Pausable {
    using AlertTypes for *;
    using AlertValidation for *;
    using AlertProcessing for *;
    using MessageFormatter for *;

    // Contracts integration
    RiskOracle public immutable riskOracle;
    PortfolioRiskAnalyzer public immutable portfolioAnalyzer;
    RiskRegistry public immutable riskRegistry;

    // Optimized storage
    mapping(uint256 => AlertTypes.Alert) public alerts;
    mapping(address => uint256[]) public userAlerts;
    mapping(address => AlertTypes.AlertSubscription[]) public userSubscriptions;
    mapping(address => AlertTypes.UserPreferences) public userPreferences;
    mapping(address => AlertTypes.AlertCounters) public userCounters;
    mapping(AlertTypes.AlertType => uint256) public alertTypeCount;
    mapping(AlertTypes.AlertPriority => uint256) public alertPriorityCount;
    mapping(address => uint256) public lastUserAction;
    
    uint256 public nextAlertId = 1;

    // Constantes
    uint256 public constant DEFAULT_COOLDOWN = 1 hours;
    uint256 public constant MAX_ALERTS_PER_USER = 100;
    uint256 public constant MAX_BATCH_SIZE = 10;
    uint256 public constant ACTION_COOLDOWN = 1 seconds;

    // Events (compact)
    event AlertTriggered(uint256 indexed alertId, address indexed user, AlertTypes.AlertType alertType);
    event AlertResolved(uint256 indexed alertId, address indexed user);
    event SubscriptionCreated(address indexed user, AlertTypes.AlertType alertType);
    event BatchProcessed(address indexed user, uint256 processed);

    // Custom errors (compact)
    error InvalidAlertId();
    error NotAlertOwner();
    error AlertAlreadyResolved();
    error NotAuthorized();
    error RateLimited();
    error InvalidAddress();

    constructor(
        address _riskOracle,
        address _portfolioAnalyzer,
        address _riskRegistry
    ) {
        if (_riskOracle == address(0) || _portfolioAnalyzer == address(0) || _riskRegistry == address(0)) {
            revert InvalidAddress();
        }
        
        riskOracle = RiskOracle(_riskOracle);
        portfolioAnalyzer = PortfolioRiskAnalyzer(_portfolioAnalyzer);
        riskRegistry = RiskRegistry(_riskRegistry);
    }

    modifier rateLimited() {
        if (block.timestamp < lastUserAction[msg.sender] + ACTION_COOLDOWN) {
            revert RateLimited();
        }
        lastUserAction[msg.sender] = block.timestamp;
        _;
    }

    modifier validAlertId(uint256 _alertId) {
        if (_alertId == 0 || _alertId >= nextAlertId) revert InvalidAlertId();
        _;
    }

    modifier onlyAlertOwner(uint256 _alertId) {
        if (alerts[_alertId].user != msg.sender) revert NotAlertOwner();
        _;
    }

    /**
     * @dev Create subscription (compact version)
     */
    function createSubscription(
        AlertTypes.AlertType _alertType,
        address _protocol,
        uint256 _threshold
    ) external nonReentrant whenNotPaused rateLimited {
        AlertValidation.validateSubscriptionParams(_threshold, userSubscriptions[msg.sender].length);
        AlertValidation.validateProtocol(_protocol);

        userSubscriptions[msg.sender].push(AlertTypes.AlertSubscription({
            user: msg.sender,
            alertType: _alertType,
            protocol: _protocol,
            threshold: _threshold,
            isActive: true,
            lastTriggered: 0,
            cooldownPeriod: DEFAULT_COOLDOWN
        }));

        emit SubscriptionCreated(msg.sender, _alertType);
    }

    /**
     * @dev Update subscription (compact version)
     */
    function updateSubscription(
        uint256 _subscriptionIndex,
        uint256 _newThreshold,
        bool _isActive,
        uint256 _cooldownPeriod
    ) external nonReentrant whenNotPaused rateLimited {
        require(_subscriptionIndex < userSubscriptions[msg.sender].length, "Invalid index");
        AlertValidation.validateUpdateParams(_newThreshold, _cooldownPeriod);

        AlertTypes.AlertSubscription storage sub = userSubscriptions[msg.sender][_subscriptionIndex];
        sub.threshold = _newThreshold;
        sub.isActive = _isActive;
        sub.cooldownPeriod = _cooldownPeriod;
    }

    /**
     * @dev Check user alerts (ultra-compact version)
     */
    function checkUserAlerts(address _user) external nonReentrant whenNotPaused {
        AlertTypes.AlertSubscription[] memory subs = userSubscriptions[_user];
        uint256 batchSize = subs.length > MAX_BATCH_SIZE ? MAX_BATCH_SIZE : subs.length;
        uint256 processed = 0;

        for (uint256 i = 0; i < batchSize;) {
            if (!AlertProcessing.shouldSkipSubscription(subs[i])) {
                if (_processAlert(_user, subs[i], i)) {
                    processed++;
                }
            }
            unchecked { i++; }
        }

        emit BatchProcessed(_user, processed);
    }

    /**
     * @dev Process alert (simplified function)
     */
    function _processAlert(
        address _user,
        AlertTypes.AlertSubscription memory _sub,
        uint256 _index
    ) internal returns (bool) {
        AlertTypes.ProcessingContext memory ctx = AlertTypes.ProcessingContext({
            user: _user,
            subscriptionIndex: _index,
            currentRisk: 0,
            threshold: _sub.threshold,
            priority: AlertTypes.AlertPriority.LOW
        });

        // Process based on type (simplified)
        if (_sub.alertType == AlertTypes.AlertType.RISK_THRESHOLD) {
            return _processRiskThreshold(_sub, ctx);
        }
        // Other types can be implemented in future versions
        return false;
    }

    /**
     * @dev Process risk threshold (ultra-simplified)
     */
    function _processRiskThreshold(
        AlertTypes.AlertSubscription memory _sub,
        AlertTypes.ProcessingContext memory _ctx
    ) internal returns (bool) {
        try riskOracle.getAggregatedRisk(_sub.protocol) returns (
            uint256, uint256, uint256, uint256, uint256, uint256 risk, uint256
        ) {
            if (risk > _ctx.threshold) {
                _ctx.currentRisk = risk;
                _ctx.priority = AlertProcessing.calculatePriority(risk, _ctx.threshold);
                
                _createAlert(_ctx, _sub.protocol, MessageFormatter.formatRiskMessage(risk, _ctx.threshold));
                userSubscriptions[_ctx.user][_ctx.subscriptionIndex].lastTriggered = block.timestamp;
                return true;
            }
        } catch {}
        return false;
    }

    /**
     * @dev Create alert (ultra-compact version)
     */
    function _createAlert(
        AlertTypes.ProcessingContext memory _ctx,
        address _protocol,
        string memory _message
    ) internal {
        AlertTypes.AlertCounters storage counters = userCounters[_ctx.user];
        if (counters.activeAlertsCount >= MAX_ALERTS_PER_USER) return;

        uint256 alertId = nextAlertId++;

        alerts[alertId] = AlertTypes.Alert({
            id: alertId,
            user: _ctx.user,
            alertType: AlertTypes.AlertType.RISK_THRESHOLD,
            priority: _ctx.priority,
            protocol: _protocol,
            message: _message,
            riskLevel: _ctx.currentRisk,
            threshold: _ctx.threshold,
            timestamp: block.timestamp,
            isActive: true,
            isResolved: false
        });

        userAlerts[_ctx.user].push(alertId);
        counters.activeAlertsCount++;
        
        emit AlertTriggered(alertId, _ctx.user, AlertTypes.AlertType.RISK_THRESHOLD);
    }

    /**
     * @dev Resolve alert (compact)
     */
    function resolveAlert(uint256 _alertId) 
        external 
        validAlertId(_alertId) 
        onlyAlertOwner(_alertId) 
        nonReentrant 
    {
        AlertTypes.Alert storage alert = alerts[_alertId];
        if (!alert.isActive) revert AlertAlreadyResolved();

        alert.isActive = false;
        alert.isResolved = true;
        userCounters[alert.user].activeAlertsCount--;
        
        emit AlertResolved(_alertId, msg.sender);
    }

    // ===== VIEW FUNCTIONS (Compact) =====

    function getUserActiveAlerts(address _user) external view returns (AlertTypes.Alert[] memory) {
        uint256[] memory alertIds = userAlerts[_user];
        uint256 activeCount = userCounters[_user].activeAlertsCount;
        
        AlertTypes.Alert[] memory activeAlerts = new AlertTypes.Alert[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < alertIds.length && index < activeCount;) {
            if (alerts[alertIds[i]].isActive) {
                activeAlerts[index] = alerts[alertIds[i]];
                unchecked { index++; }
            }
            unchecked { i++; }
        }
        
        return activeAlerts;
    }

    function getUserSubscriptions(address _user) external view returns (AlertTypes.AlertSubscription[] memory) {
        return userSubscriptions[_user];
    }

    // ===== ADMIN FUNCTIONS =====

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}