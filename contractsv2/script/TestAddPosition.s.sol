// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";

/**
 * @title TestAddPosition
 * @dev Script to test the addPosition function
 */
contract TestAddPosition is Script {
    // Contract addresses
    address constant PORTFOLIO_ANALYZER = 0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192;
    
    // Token addresses on Avalanche Fuji
    address constant USDC = 0x5425890298aed601595a70AB815c96711a31Bc65;
    address constant WAVAX = 0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3;
    address constant WETH = 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        PortfolioRiskAnalyzer analyzer = PortfolioRiskAnalyzer(PORTFOLIO_ANALYZER);
        
        console.log("=== TESTING ADD POSITION ===");
        
        // Using registered Uniswap V3 protocol address
        address uniswapV3Protocol = 0x2626664c2603336E57B271c5C0b26F421741e481;
        
        // Test adding a small USDC position
        try analyzer.addPosition(uniswapV3Protocol, USDC, 1000 * 10**6) { // 1000 USDC (6 decimals)
            console.log("SUCCESS: Added USDC position");
        } catch Error(string memory reason) {
            console.log("FAILED: USDC position -", reason);
        } catch {
            console.log("FAILED: USDC position - unknown error");
        }
        
        // Test adding a small WAVAX position
        try analyzer.addPosition(uniswapV3Protocol, WAVAX, 10 * 10**18) { // 10 WAVAX (18 decimals)
            console.log("SUCCESS: Added WAVAX position");
        } catch Error(string memory reason) {
            console.log("FAILED: WAVAX position -", reason);
        } catch {
            console.log("FAILED: WAVAX position - unknown error");
        }
        
        // Test adding a small WETH position
        try analyzer.addPosition(uniswapV3Protocol, WETH, 1 * 10**18) { // 1 WETH (18 decimals)
            console.log("SUCCESS: Added WETH position");
        } catch Error(string memory reason) {
            console.log("FAILED: WETH position -", reason);
        } catch {
            console.log("FAILED: WETH position - unknown error");
        }
        
        vm.stopBroadcast();
        console.log("=== TEST COMPLETE ===");
    }
}