// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/libraries/AlertValidation.sol

import "./AlertTypes.sol";

library AlertValidation {
    function validateSubscriptionParams(
        //AlertTypes.AlertType _type,
        address _protocol,
        uint256 _threshold
        //AlertTypes.AlertPriority _priority
    ) internal pure {
        require(_protocol != address(0), "Invalid protocol address");
        require(_threshold > 0, "Threshold must be positive");
        // Validações adicionais podem ser implementadas conforme necessário
    }
}