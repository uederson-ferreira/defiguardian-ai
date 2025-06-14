// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../oracles/RiskOracle.sol";
import "../core/RiskRegistry.sol";
import "../core/PortfolioRiskAnalyzer.sol";

/**
 * @title AlertSystem
 * @dev Automated alert system for risk management
 */
contract AlertSystem is Ownable(msg.sender), ReentrancyGuard {
    
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
        uint256 cooldownPeriod; // Minimum time between alerts
    }

    struct UserPreferences {
        bool enableEmailAlerts;
        bool enablePushNotifications;
        bool enableSMSAlerts;
        uint256 minimumPriority; // Minimum priority to trigger alerts
        uint256 globalCooldown;  // Global cooldown between any alerts
    }

    // Contracts integration
    RiskOracle public immutable riskOracle;
    PortfolioRiskAnalyzer public immutable portfolioAnalyzer;
    RiskRegistry public immutable riskRegistry;

    // Alert storage
    mapping(uint256 => Alert) public alerts;
    mapping(address => uint256[]) public userAlerts;
    mapping(address => AlertSubscription[]) public userSubscriptions;
    mapping(address => UserPreferences) public userPreferences;
    
    uint256 public nextAlertId = 1;
    uint256 public constant DEFAULT_COOLDOWN = 1 hours;
    uint256 public constant MAX_ALERTS_PER_USER = 100;

    // Alert counters
    mapping(address => uint256) public activeAlertsCount;
    mapping(AlertType => uint256) public alertTypeCount;
    mapping(AlertPriority => uint256) public alertPriorityCount;

    // Events
    event AlertTriggered(
        uint256 indexed alertId,
        address indexed user,
        AlertType alertType,
        AlertPriority priority,
        string message
    );
    event AlertResolved(uint256 indexed alertId, address indexed user);
    event SubscriptionCreated(address indexed user, AlertType alertType, address protocol);
    event SubscriptionUpdated(address indexed user, uint256 subscriptionIndex);
    event SubscriptionRemoved(address indexed user, uint256 subscriptionIndex);
    event UserPreferencesUpdated(address indexed user);

    // Modifiers
    modifier validAlertId(uint256 _alertId) {
        require(_alertId > 0 && _alertId < nextAlertId, "Invalid alert ID");
        _;
    }

    modifier onlyAlertOwner(uint256 _alertId) {
        require(alerts[_alertId].user == msg.sender, "Not alert owner");
        _;
    }

    constructor(
        address _riskOracle,
        address _portfolioAnalyzer,
        address _riskRegistry
    ) {
        riskOracle = RiskOracle(_riskOracle);
        portfolioAnalyzer = PortfolioRiskAnalyzer(_portfolioAnalyzer);
        riskRegistry = RiskRegistry(_riskRegistry);
    }

    /**
     * @dev Create a new alert subscription
     */
    function createSubscription(
        AlertType _alertType,
        address _protocol,
        uint256 _threshold
    ) external {
        require(_threshold <= 10000, "Threshold too high");
        require(userSubscriptions[msg.sender].length < 50, "Too many subscriptions");

        userSubscriptions[msg.sender].push(AlertSubscription({
            user: msg.sender,
            alertType: _alertType,
            protocol: _protocol,
            threshold: _threshold,
            isActive: true,
            lastTriggered: 0,
            cooldownPeriod: DEFAULT_COOLDOWN
        }));

        emit SubscriptionCreated(msg.sender, _alertType, _protocol);
    }

    /**
     * @dev Update an existing subscription
     */
    function updateSubscription(
        uint256 _subscriptionIndex,
        uint256 _newThreshold,
        bool _isActive,
        uint256 _cooldownPeriod
    ) external {
        require(_subscriptionIndex < userSubscriptions[msg.sender].length, "Invalid subscription");
        require(_newThreshold <= 10000, "Threshold too high");
        require(_cooldownPeriod >= 10 minutes, "Cooldown too short");

        AlertSubscription storage subscription = userSubscriptions[msg.sender][_subscriptionIndex];
        subscription.threshold = _newThreshold;
        subscription.isActive = _isActive;
        subscription.cooldownPeriod = _cooldownPeriod;

        emit SubscriptionUpdated(msg.sender, _subscriptionIndex);
    }

    /**
     * @dev Remove a subscription
     */
    function removeSubscription(uint256 _subscriptionIndex) external {
        require(_subscriptionIndex < userSubscriptions[msg.sender].length, "Invalid subscription");

        // Move last element to deleted spot and pop
        uint256 lastIndex = userSubscriptions[msg.sender].length - 1;
        userSubscriptions[msg.sender][_subscriptionIndex] = userSubscriptions[msg.sender][lastIndex];
        userSubscriptions[msg.sender].pop();

        emit SubscriptionRemoved(msg.sender, _subscriptionIndex);
    }

    /**
     * @dev Set user alert preferences
     */
    function setUserPreferences(
        bool _enableEmailAlerts,
        bool _enablePushNotifications,
        bool _enableSMSAlerts,
        uint256 _minimumPriority,
        uint256 _globalCooldown
    ) external {
        require(_minimumPriority <= 3, "Invalid priority level");
        require(_globalCooldown >= 5 minutes, "Cooldown too short");

        userPreferences[msg.sender] = UserPreferences({
            enableEmailAlerts: _enableEmailAlerts,
            enablePushNotifications: _enablePushNotifications,
            enableSMSAlerts: _enableSMSAlerts,
            minimumPriority: _minimumPriority,
            globalCooldown: _globalCooldown
        });

        emit UserPreferencesUpdated(msg.sender);
    }

    /**
     * @dev Check all user subscriptions and trigger alerts if needed
     */
    function checkUserAlerts(address _user) external {
        AlertSubscription[] memory subscriptions = userSubscriptions[_user];

        for (uint256 i = 0; i < subscriptions.length; i++) {
            AlertSubscription memory subscription = subscriptions[i];
            
            if (!subscription.isActive) continue;
            if (block.timestamp - subscription.lastTriggered < subscription.cooldownPeriod) continue;

            // Check specific alert type
            if (subscription.alertType == AlertType.RISK_THRESHOLD) {
                _checkRiskThresholdAlert(_user, subscription, i);
            } else if (subscription.alertType == AlertType.LIQUIDATION_WARNING) {
                _checkLiquidationAlert(_user, subscription, i);
            } else if (subscription.alertType == AlertType.PORTFOLIO_HEALTH) {
                _checkPortfolioHealthAlert(_user, subscription, i);
            } else if (subscription.alertType == AlertType.PRICE_VOLATILITY) {
                _checkPriceVolatilityAlert(_user, subscription, i);
            }
        }
    }

    /**
     * @dev Check risk threshold alerts
     */
    function _checkRiskThresholdAlert(
        address _user,
        AlertSubscription memory _subscription,
        uint256 _subscriptionIndex
    ) internal {
        try riskOracle.getAggregatedRisk(_subscription.protocol) returns (
            uint256, uint256, uint256, uint256, uint256, uint256 overallRisk, uint256
        ) {
            if (overallRisk > _subscription.threshold) {
                AlertPriority priority = _calculatePriority(overallRisk, _subscription.threshold);
                
                string memory message = string(abi.encodePacked(
                    "Risk threshold exceeded for protocol. Current risk: ",
                    _uint2str(overallRisk / 100),
                    "%, Threshold: ",
                    _uint2str(_subscription.threshold / 100),
                    "%"
                ));

                _createAlert(
                    _user,
                    AlertType.RISK_THRESHOLD,
                    priority,
                    _subscription.protocol,
                    message,
                    overallRisk,
                    _subscription.threshold
                );

                // Update last triggered time
                userSubscriptions[_user][_subscriptionIndex].lastTriggered = block.timestamp;
            }
        } catch {
            // Risk data not available
            return;
        }
    }

    /**
     * @dev Check liquidation warning alerts
     */
    function _checkLiquidationAlert(
        address _user,
        AlertSubscription memory _subscription,
        uint256 _subscriptionIndex
    ) internal {
        // Get user's portfolio risk
        uint256 portfolioRisk = portfolioAnalyzer.calculatePortfolioRisk(_user);
        
        // Check if portfolio risk indicates potential liquidation
        if (portfolioRisk > 8500) { // 85% risk threshold for liquidation warning
            AlertPriority priority = AlertPriority.CRITICAL;
            
            string memory message = string(abi.encodePacked(
                "LIQUIDATION WARNING: Your portfolio risk is critically high at ",
                _uint2str(portfolioRisk / 100),
                "%. Consider reducing exposure immediately."
            ));

            _createAlert(
                _user,
                AlertType.LIQUIDATION_WARNING,
                priority,
                _subscription.protocol,
                message,
                portfolioRisk,
                8500
            );

            userSubscriptions[_user][_subscriptionIndex].lastTriggered = block.timestamp;
        }
    }

    /**
     * @dev Check portfolio health alerts
     */
    function _checkPortfolioHealthAlert(
        address _user,
        AlertSubscription memory _subscription,
        uint256 _subscriptionIndex
    ) internal {
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = 
            portfolioAnalyzer.getPortfolioAnalysis(_user);

        if (!analysis.isValid) return;

        // Check if portfolio health is degrading
        if (analysis.overallRisk > _subscription.threshold) {
            AlertPriority priority = _calculatePriority(analysis.overallRisk, _subscription.threshold);
            
            string memory message = string(abi.encodePacked(
                "Portfolio health alert: Risk level at ",
                _uint2str(analysis.overallRisk / 100),
                "%, Diversification: ",
                _uint2str(analysis.diversificationScore / 100),
                "%"
            ));

            _createAlert(
                _user,
                AlertType.PORTFOLIO_HEALTH,
                priority,
                address(0),
                message,
                analysis.overallRisk,
                _subscription.threshold
            );

            userSubscriptions[_user][_subscriptionIndex].lastTriggered = block.timestamp;
        }
    }

    /**
     * @dev Check price volatility alerts
     */
    function _checkPriceVolatilityAlert(
        address _user,
        AlertSubscription memory _subscription,
        uint256 _subscriptionIndex
    ) internal {
        try riskOracle.getAggregatedRisk(_subscription.protocol) returns (
            uint256 volatilityRisk, uint256, uint256, uint256, uint256, uint256, uint256
        ) {
            if (volatilityRisk > _subscription.threshold) {
                AlertPriority priority = _calculatePriority(volatilityRisk, _subscription.threshold);
                
                string memory message = string(abi.encodePacked(
                    "High price volatility detected for protocol. Volatility risk: ",
                    _uint2str(volatilityRisk / 100),
                    "%"
                ));

                _createAlert(
                    _user,
                    AlertType.PRICE_VOLATILITY,
                    priority,
                    _subscription.protocol,
                    message,
                    volatilityRisk,
                    _subscription.threshold
                );

                userSubscriptions[_user][_subscriptionIndex].lastTriggered = block.timestamp;
            }
        } catch {
            return;
        }
    }

    /**
     * @dev Create a new alert
     */
    function _createAlert(
        address _user,
        AlertType _alertType,
        AlertPriority _priority,
        address _protocol,
        string memory _message,
        uint256 _riskLevel,
        uint256 _threshold
    ) internal {
        // Check if user has reached maximum alerts
        if (activeAlertsCount[_user] >= MAX_ALERTS_PER_USER) {
            // Remove oldest alert to make room
            _removeOldestAlert(_user);
        }

        // Check user preferences if they exist
        UserPreferences memory prefs = userPreferences[_user];
        if (prefs.globalCooldown > 0 && uint256(_priority) < prefs.minimumPriority) return;

        Alert memory newAlert = Alert({
            id: nextAlertId,
            user: _user,
            alertType: _alertType,
            priority: _priority,
            protocol: _protocol,
            message: _message,
            riskLevel: _riskLevel,
            threshold: _threshold,
            timestamp: block.timestamp,
            isActive: true,
            isResolved: false
        });

        alerts[nextAlertId] = newAlert;
        userAlerts[_user].push(nextAlertId);
        
        // Update counters
        activeAlertsCount[_user]++;
        alertTypeCount[_alertType]++;
        alertPriorityCount[_priority]++;

        emit AlertTriggered(nextAlertId, _user, _alertType, _priority, _message);
        nextAlertId++;
    }

    /**
     * @dev Calculate alert priority based on risk level vs threshold
     */
    function _calculatePriority(uint256 _riskLevel, uint256 _threshold) internal pure returns (AlertPriority) {
        if (_riskLevel <= _threshold) return AlertPriority.LOW;
        
        uint256 excess = _riskLevel - _threshold;
        uint256 ratio = (excess * 100) / _threshold;

        if (ratio >= 50) return AlertPriority.CRITICAL;  // 50%+ above threshold
        if (ratio >= 25) return AlertPriority.HIGH;      // 25%+ above threshold
        if (ratio >= 10) return AlertPriority.MEDIUM;    // 10%+ above threshold
        return AlertPriority.LOW;
    }

    /**
     * @dev Remove oldest alert for user
     */
    function _removeOldestAlert(address _user) internal {
        uint256[] storage userAlertIds = userAlerts[_user];
        if (userAlertIds.length == 0) return;

        uint256 oldestAlertId = userAlertIds[0];
        alerts[oldestAlertId].isActive = false;
        
        // Remove from user's alert list
        for (uint256 i = 0; i < userAlertIds.length - 1; i++) {
            userAlertIds[i] = userAlertIds[i + 1];
        }
        userAlertIds.pop();
        
        activeAlertsCount[_user]--;
    }

    /**
     * @dev Resolve an alert
     */
    function resolveAlert(uint256 _alertId) external validAlertId(_alertId) onlyAlertOwner(_alertId) {
        Alert storage alert = alerts[_alertId];
        require(alert.isActive, "Alert already resolved");

        alert.isActive = false;
        alert.isResolved = true;
        
        activeAlertsCount[alert.user]--;
        
        emit AlertResolved(_alertId, msg.sender);
    }

    /**
     * @dev Get user's active alerts
     */
    function getUserActiveAlerts(address _user) external view returns (Alert[] memory) {
        uint256[] memory alertIds = userAlerts[_user];
        uint256 activeCount = 0;
        
        // Count active alerts
        for (uint256 i = 0; i < alertIds.length; i++) {
            if (alerts[alertIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active alerts
        Alert[] memory activeAlerts = new Alert[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < alertIds.length; i++) {
            if (alerts[alertIds[i]].isActive) {
                activeAlerts[index] = alerts[alertIds[i]];
                index++;
            }
        }
        
        return activeAlerts;
    }

    /**
     * @dev Get user's subscriptions
     */
    function getUserSubscriptions(address _user) external view returns (AlertSubscription[] memory) {
        return userSubscriptions[_user];
    }

    /**
     * @dev Get alert statistics
     */
    function getAlertStats() external view returns (
        uint256 totalAlerts,
        uint256 activeAlerts,
        uint256 criticalAlerts,
        uint256 highAlerts,
        uint256 mediumAlerts,
        uint256 lowAlerts
    ) {
        uint256 totalActiveAlerts = 0;
        for (uint256 i = 1; i < nextAlertId; i++) {
            if (alerts[i].isActive) {
                totalActiveAlerts++;
            }
        }

        return (
            nextAlertId - 1,
            totalActiveAlerts,
            alertPriorityCount[AlertPriority.CRITICAL],
            alertPriorityCount[AlertPriority.HIGH],
            alertPriorityCount[AlertPriority.MEDIUM],
            alertPriorityCount[AlertPriority.LOW]
        );
    }

    /**
     * @dev Utility function to convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
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
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }

    /**
     * @dev Emergency function to disable all alerts for a user
     */
    function emergencyDisableAlerts(address _user) external {
        require(msg.sender == _user || msg.sender == owner(), "Not authorized");
        
        // Disable all subscriptions
        for (uint256 i = 0; i < userSubscriptions[_user].length; i++) {
            userSubscriptions[_user][i].isActive = false;
        }
        
        // Resolve all active alerts
        uint256[] memory alertIds = userAlerts[_user];
        for (uint256 i = 0; i < alertIds.length; i++) {
            if (alerts[alertIds[i]].isActive) {
                alerts[alertIds[i]].isActive = false;
                alerts[alertIds[i]].isResolved = true;
            }
        }
        
        activeAlertsCount[_user] = 0;
    }
}