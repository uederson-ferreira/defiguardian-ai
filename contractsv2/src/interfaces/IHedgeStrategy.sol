// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/interfaces/IHedgeStrategy.sol

// ========== IHedgeStrategy.sol ==========
interface IHedgeStrategy {
    enum HedgeType {
        STOP_LOSS,
        REBALANCE,
        VOLATILITY,
        CROSS_CHAIN
    }

    function executeHedge(address user, uint256 identifier) external;
    function checkHedgeNeeded(address user, uint256 identifier) external view returns (bool needsHedge, bytes memory data);
    function getActiveHedges(address user) external view returns (uint256[] memory);
    function cancelHedge(address user, uint256 identifier) external;
    function getHedgeType() external pure returns (HedgeType);
}