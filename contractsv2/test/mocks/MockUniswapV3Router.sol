// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//test/mocks/MockUniswapV3Router.sol
// Using local ISwapRouter interface to avoid conflicts

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    struct ExactOutputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
    function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (uint256 amountIn);
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
    function exactOutput(ExactOutputParams calldata params) external payable returns (uint256 amountIn);
    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external;
}

contract MockUniswapV3Router is ISwapRouter {
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
        // Simular swap
        return params.amountIn / 2; // Exemplo simplificado
    }
    
    function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (uint256 amountIn) {
        // Simular swap reverso
        return params.amountOut * 2; // Exemplo simplificado
    }
    
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut) {
        // Simular multi-hop swap
        return params.amountIn / 2; // Exemplo simplificado
    }
    
    function exactOutput(ExactOutputParams calldata params) external payable returns (uint256 amountIn) {
        // Simular multi-hop swap reverso
        return params.amountOut * 2; // Exemplo simplificado
    }
    
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external {
        // Mock implementation - do nothing
    }
}