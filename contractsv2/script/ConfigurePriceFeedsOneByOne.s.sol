// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";

/**
 * @title ConfigurePriceFeedsOneByOne
 * @dev Script to configure price feeds one by one to identify issues
 */
contract ConfigurePriceFeedsOneByOne is Script {
    // Contract addresses
    address constant PORTFOLIO_ANALYZER = 0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192;
    
    // Token addresses on Avalanche Fuji
    address constant USDC = 0x5425890298aed601595a70AB815c96711a31Bc65;
    address constant WAVAX = 0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3;
    address constant WETH = 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;
    
    // Chainlink Price Feed addresses on Avalanche Fuji
    address constant USDC_USD_FEED = 0x86d67c3D38D2bCeE722E601025C25a575021c6EA; // ETH/USD as fallback
    address constant AVAX_USD_FEED = 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD;
    address constant ETH_USD_FEED = 0x86d67c3D38D2bCeE722E601025C25a575021c6EA;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        PortfolioRiskAnalyzer analyzer = PortfolioRiskAnalyzer(PORTFOLIO_ANALYZER);
        
        console.log("=== CONFIGURING PRICE FEEDS ONE BY ONE ===");
        
        // Try USDC first
        try this.configurePriceFeed(analyzer, USDC, USDC_USD_FEED, "USDC") {
            console.log("SUCCESS: USDC price feed configured");
        } catch Error(string memory reason) {
            console.log("FAILED: USDC price feed -", reason);
        } catch {
            console.log("FAILED: USDC price feed - unknown error");
        }
        
        // Try WAVAX
        try this.configurePriceFeed(analyzer, WAVAX, AVAX_USD_FEED, "WAVAX") {
            console.log("SUCCESS: WAVAX price feed configured");
        } catch Error(string memory reason) {
            console.log("FAILED: WAVAX price feed -", reason);
        } catch {
            console.log("FAILED: WAVAX price feed - unknown error");
        }
        
        // Try WETH
        try this.configurePriceFeed(analyzer, WETH, ETH_USD_FEED, "WETH") {
            console.log("SUCCESS: WETH price feed configured");
        } catch Error(string memory reason) {
            console.log("FAILED: WETH price feed -", reason);
        } catch {
            console.log("FAILED: WETH price feed - unknown error");
        }
        
        vm.stopBroadcast();
        console.log("=== CONFIGURATION COMPLETE ===");
    }
    
    function configurePriceFeed(
        PortfolioRiskAnalyzer analyzer,
        address token,
        address priceFeed,
        string memory tokenName
    ) external {
        console.log("Configuring", tokenName, "price feed...");
        analyzer.setPriceFeed(token, priceFeed);
        console.log(tokenName, "price feed set successfully");
    }
}