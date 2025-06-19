// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/libraries/AlertValidation.sol

import "./AlertTypes.sol";

library AlertValidation {
    function validateSubscriptionParams(
        address _protocol,
        uint256 _threshold
    ) internal pure {
        require(_protocol != address(0), "Invalid protocol address");
        require(_threshold > 0, "Threshold must be positive");
        require(_threshold <= 10000, "Threshold must be <= 10000");
        // Additional validations can be implemented as needed
    }

    function validateSubscriptionParamsWithType(
        AlertTypes.AlertType _type,
        address _protocol,
        uint256 _threshold,
        AlertTypes.AlertPriority _priority
    ) internal pure {
        require(_protocol != address(0), "Invalid protocol address");
        require(_threshold > 0, "Threshold must be positive");
        require(_threshold <= 10000, "Threshold must be <= 10000");
        
        // Type-specific validations
        if (_type == AlertTypes.AlertType.RISK_THRESHOLD) {
            require(_threshold >= 1000, "Risk threshold too low"); // Min 10%
        }
        
        // Priority validation
        require(uint256(_priority) <= 2, "Invalid priority level");
    }
}