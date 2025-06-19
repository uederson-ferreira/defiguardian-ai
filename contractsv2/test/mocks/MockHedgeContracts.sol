// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockVolatilityHedge
 * @dev Mock contract for VolatilityHedge testing
 */
contract MockVolatilityHedge {
    function checkAllPositionsForVolatility() 
        external pure returns (address[] memory users, uint256[] memory positionIds, bool[] memory needsHedge) {
        // Return empty arrays for testing
        users = new address[](0);
        positionIds = new uint256[](0);
        needsHedge = new bool[](0);
    }
    
    function executeVolatilityHedge(address /*user*/, uint256 /*positionId*/) external pure {
        // Mock implementation - do nothing
    }
    
    function updatePriceAndCheckVolatility(address /*user*/, uint256 /*positionId*/) 
        external pure returns (bool needsHedge, uint256 volatility) {
        return (false, 0);
    }
}

/**
 * @title MockCrossChainHedge
 * @dev Mock contract for CrossChainHedge testing
 */
contract MockCrossChainHedge {
    function checkCrossChainPositions() 
        external pure returns (address[] memory users, uint256[] memory chainIds, bool[] memory needsHedge) {
        // Return empty arrays for testing
        users = new address[](0);
        chainIds = new uint256[](0);
        needsHedge = new bool[](0);
    }
    
    function executeCrossChainHedge(address /*user*/, uint256 /*chainId*/) external pure {
        // Mock implementation - do nothing
    }
    
    function getActiveChains() external pure returns (uint256[] memory) {
        return new uint256[](0);
    }
}