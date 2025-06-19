// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/libraries/AlertProcessing.sol

import "./AlertTypes.sol";

library AlertProcessing {
    function shouldSkip(
        AlertTypes.AlertSubscription memory _subscription
    ) internal pure returns (bool) {
        if (!_subscription.active) {
            return true;
        }
        // Add additional logic, e.g., check if it was processed recently
        return false;
    }

    function shouldSkipWithContext(
        AlertTypes.AlertSubscription memory _subscription,
        AlertTypes.ProcessingContext memory _context
    ) internal view returns (bool) {
        if (!_subscription.active) {
            return true;
        }
        
        // Context-based processing logic
        // Example: skip if processed in current block
        if (_context.currentBlock == block.number) {

            return true;
        }
        
        return false;
    }
}