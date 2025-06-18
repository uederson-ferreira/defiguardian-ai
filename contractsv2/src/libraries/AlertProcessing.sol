// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/libraries/AlertProcessing.sol

import "./AlertTypes.sol";

library AlertProcessing {
    function shouldSkip(
        AlertTypes.AlertSubscription memory _subscription
        //AlertTypes.ProcessingContext memory _context
    ) internal pure returns (bool) {
        if (!_subscription.active) {
            return true;
        }
        // Adicionar lógica adicional, e.g., verificar se já foi processado recentemente
        return false;
    }
}