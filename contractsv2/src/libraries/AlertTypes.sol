// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/libraries/AlertTypes.sol

library AlertTypes {
    enum AlertType { RISK_THRESHOLD, PRICE_DROP, VOLATILITY_SPIKE }
    enum AlertPriority { LOW, MEDIUM, HIGH }

    struct UserPreferences {
        bool emailEnabled;
        bool telegramEnabled;
        bool pushNotificationEnabled;
    }

    struct AlertSubscription {
        AlertType type_;
        address protocol;
        uint256 threshold;
        AlertPriority priority;
        UserPreferences preferences;
        bool active;
    }

    struct Alert {
        uint256 subscriptionId;
        AlertType type_;
        address protocol;
        uint256 value;
        AlertPriority priority;
        string message;
        uint256 timestamp;
    }

    struct ProcessingContext {
        uint256 currentBlock;
        uint256 lastProcessedTimestamp;
    }

    function createProcessingContext() internal view returns (ProcessingContext memory) {
        return ProcessingContext({
            currentBlock: block.number,
            lastProcessedTimestamp: block.timestamp
        });
    }
}