// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//test/mocks/MockUniswapV3Router.sol

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract MockUniswapV3Router is ISwapRouter {
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
        // Simular swap
        return params.amountIn / 2; // Exemplo simplificado
    }
}