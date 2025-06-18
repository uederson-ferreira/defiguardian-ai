// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/automation/AlertSystem.sol

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IAlertSystem.sol";
import "../libraries/AlertTypes.sol";
import "../libraries/AlertValidation.sol";
import "../libraries/AlertProcessing.sol";
import "../libraries/MessageFormatter.sol";
import "../core/ContractRegistry.sol";
import "../interfaces/IRiskOracle.sol";
import "../interfaces/IPortfolioAnalyzer.sol";
import "../interfaces/IRiskRegistry.sol";

contract AlertSystem is IAlertSystem, Ownable, ReentrancyGuard, Pausable {
    using AlertTypes for *;
    using AlertValidation for *;
    using AlertProcessing for *;
    using AlertMessageFormatter for *;

    ContractRegistry public immutable contractRegistry;
    bytes32 private constant RISK_ORACLE = keccak256("RiskOracle");
    bytes32 private constant PORTFOLIO_ANALYZER = keccak256("PortfolioRiskAnalyzer");
    bytes32 private constant RISK_REGISTRY = keccak256("RiskRegistry");

    mapping(address => AlertTypes.AlertSubscription[]) public userSubscriptions;
    mapping(address => Alert[]) public userAlerts;

    event AlertTriggered(address indexed user, uint256 indexed subscriptionId, Alert alert);
    event SubscriptionCreated(address indexed user, uint256 subscriptionId);
    event SubscriptionRemoved(address indexed user, uint256 subscriptionId);

    constructor(address _contractRegistry) Ownable(msg.sender) {
        contractRegistry = ContractRegistry(_contractRegistry);
    }

    function createSubscription(
        AlertType _alertType,
        address _protocol,
        uint256 _threshold
    ) external override nonReentrant whenNotPaused {
        // Convert interface AlertType to internal AlertTypes.AlertType
        AlertTypes.AlertType internalType = AlertTypes.AlertType(uint256(_alertType));
        // Use default priority and email settings
        AlertTypes.AlertPriority priority = AlertTypes.AlertPriority.MEDIUM;
        AlertValidation.validateSubscriptionParams(internalType, _protocol, _threshold, priority);
        IRiskRegistry riskRegistryInstance = getRiskRegistry();
        riskRegistryInstance.protocols(_protocol); // Validate protocol exists
        AlertTypes.UserPreferences memory preferences = AlertTypes.UserPreferences({
            emailEnabled: true,
            telegramEnabled: false,
            pushNotificationEnabled: true
        });

        uint256 subscriptionId = userSubscriptions[msg.sender].length;
        userSubscriptions[msg.sender].push(AlertTypes.AlertSubscription({
            type_: internalType,
            protocol: _protocol,
            threshold: _threshold,
            priority: priority,
            preferences: preferences,
            active: true
        }));

        emit SubscriptionCreated(msg.sender, subscriptionId);
    }

    // Custom function not in interface
    function removeSubscription(uint256 _subId) external nonReentrant whenNotPaused {
        require(_subId < userSubscriptions[msg.sender].length, "Invalid subscription ID");
        userSubscriptions[msg.sender][_subId].active = false;
        emit SubscriptionRemoved(msg.sender, _subId);
    }

    function checkUserAlerts(address _user) external override nonReentrant whenNotPaused {
        AlertTypes.AlertSubscription[] memory subscriptions = userSubscriptions[_user];
        // Remove unused variable riskOracleInstance
        // Removed unused portfolioAnalyzerInstance variable
        AlertTypes.ProcessingContext memory context = AlertTypes.createProcessingContext();

        for (uint256 i = 0; i < subscriptions.length; i++) {
            if (AlertProcessing.shouldSkip(subscriptions[i], context)) {
                continue;
            }
            bool triggered = false;
            if (subscriptions[i].type_ == AlertTypes.AlertType.RISK_THRESHOLD) {
                triggered = _processRiskThreshold(subscriptions[i]);
            }

            if (triggered) {
                // Create interface-compatible Alert
                Alert memory alert = Alert({
                    id: i,
                    user: _user,
                    alertType: AlertType(uint(subscriptions[i].type_)),
                    priority: AlertPriority(uint(subscriptions[i].priority)),
                    protocol: subscriptions[i].protocol,
                    message: AlertMessageFormatter.formatRiskMessage(subscriptions[i].protocol, subscriptions[i].threshold),
                    riskLevel: subscriptions[i].threshold,
                    threshold: subscriptions[i].threshold,
                    timestamp: block.timestamp,
                    isActive: true,
                    isResolved: false
                });
                userAlerts[_user].push(alert);
                emit AlertTriggered(_user, i, alert);
            }
        }
    }

    function _processRiskThreshold(
    AlertTypes.AlertSubscription memory _sub
    ) internal view
returns (bool) {
        try getRiskOracle().getAggregatedRisk(_sub.protocol) returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256 risk,
            uint256
        ) {
            if (risk > _sub.threshold) {
                return true;
            }
        } catch {}
        return false;
    }

    function resolveAlert(uint256 _alertId) external override nonReentrant whenNotPaused {
        require(_alertId < userAlerts[msg.sender].length, "Invalid alert ID");
        delete userAlerts[msg.sender][_alertId]; // Simple resolution logic
    }

    // Custom function not in interface
    function getUserActiveSubscriptions(address _user) external view returns (AlertTypes.AlertSubscription[] memory) {
        AlertTypes.AlertSubscription[] memory subscriptions = userSubscriptions[_user];
        uint256 count = 0;
        for (uint256 i = 0; i < subscriptions.length; i++) {
            if (subscriptions[i].active) {
                count++;
            }
        }

        AlertTypes.AlertSubscription[] memory activeSubs = new AlertTypes.AlertSubscription[](count);
        count = 0;
        for (uint256 i = 0; i < subscriptions.length; i++) {
            if (subscriptions[i].active) {
                activeSubs[count++] = subscriptions[i];
            }
        }

        return activeSubs;
    }

    function getUserActiveAlerts(address _user) external view override returns (Alert[] memory) {
        // Return the alerts directly since we're now using the interface Alert type
        return userAlerts[_user];
    }

    function riskRegistry() external view override returns (address) {
        return contractRegistry.getContract(RISK_REGISTRY);
    }
    
    function getRiskRegistry() internal view returns (IRiskRegistry) {
        return IRiskRegistry(contractRegistry.getContract(RISK_REGISTRY));
    }

    function riskOracle() external view override returns (address) {
        return contractRegistry.getContract(RISK_ORACLE);
    }
    
    function getRiskOracle() internal view returns (IRiskOracle) {
        return IRiskOracle(contractRegistry.getContract(RISK_ORACLE));
    }

    function portfolioAnalyzer() external view override returns (address) {
        return contractRegistry.getContract(PORTFOLIO_ANALYZER);
    }
    
    function getPortfolioAnalyzer() internal view returns (IPortfolioAnalyzer) {
        return IPortfolioAnalyzer(contractRegistry.getContract(PORTFOLIO_ANALYZER));
    }
}