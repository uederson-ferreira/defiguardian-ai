// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/interfaces/IAlertSystem.sol

// ========== IAlertSystem.sol ==========
interface IAlertSystem {
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

function riskOracle() external view returns (address);
    function portfolioAnalyzer() external view returns (address);
    function riskRegistry() external view returns (address);

    function createSubscription(AlertType _alertType, address _protocol, uint256 _threshold) external;
    function checkUserAlerts(address _user) external;
    function resolveAlert(uint256 _alertId) external;
    function getUserActiveAlerts(address _user) external view returns (Alert[] memory);
}