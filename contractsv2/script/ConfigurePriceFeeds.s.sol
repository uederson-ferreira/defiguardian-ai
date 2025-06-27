// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";

/**
 * @title ConfigurePriceFeeds
 * @dev Script to configure price feeds for PortfolioRiskAnalyzer on Avalanche Fuji
 */
contract ConfigurePriceFeeds is Script {
    // Avalanche Fuji Testnet addresses
    address constant PORTFOLIO_ANALYZER = 0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192;
    
    // Token addresses on Avalanche Fuji
    address constant USDC_TOKEN = 0x5425890298aed601595a70AB815c96711a31Bc65;
    address constant WAVAX_TOKEN = 0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3;
    address constant WETH_TOKEN = 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;
    
    // Chainlink Price Feed Addresses on Avalanche Fuji
    // Note: USDC/USD feed may not be available on Fuji, using ETH/USD as fallback for testing
    address constant USDC_USD_FEED = 0x86d67c3D38D2bCeE722E601025C25a575021c6EA; // Using ETH/USD as fallback
    address constant AVAX_USD_FEED = 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD;
    address constant ETH_USD_FEED = 0x86d67c3D38D2bCeE722E601025C25a575021c6EA;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        PortfolioRiskAnalyzer portfolioAnalyzer = PortfolioRiskAnalyzer(PORTFOLIO_ANALYZER);
        
        console.log("Configuring Price Feeds for PortfolioRiskAnalyzer...");
        console.log("Contract Address:", PORTFOLIO_ANALYZER);
        
        // Configure USDC price feed
        console.log("Setting USDC price feed (using ETH/USD as fallback for testing)...");
        console.log("     Token:", USDC_TOKEN);
        console.log("     Feed:", USDC_USD_FEED);
        portfolioAnalyzer.setPriceFeed(USDC_TOKEN, USDC_USD_FEED);
        
        // Configure WAVAX price feed
        console.log("\nSetting WAVAX price feed...");
        console.log("   Token:", WAVAX_TOKEN);
        console.log("   Feed:", AVAX_USD_FEED);
        portfolioAnalyzer.setPriceFeed(WAVAX_TOKEN, AVAX_USD_FEED);
        
        // Configure WETH price feed
        console.log("\nSetting WETH price feed...");
        console.log("   Token:", WETH_TOKEN);
        console.log("   Feed:", ETH_USD_FEED);
        portfolioAnalyzer.setPriceFeed(WETH_TOKEN, ETH_USD_FEED);
        
        vm.stopBroadcast();
        
        console.log("\nPrice feeds configuration completed!");
        console.log("PortfolioRiskAnalyzer is now ready to analyze positions.");
        
        // Verify configuration
        console.log("\nVerifying configuration...");
        address usdcFeed = address(portfolioAnalyzer.priceFeeds(USDC_TOKEN));
        address wavaxFeed = address(portfolioAnalyzer.priceFeeds(WAVAX_TOKEN));
        address wethFeed = address(portfolioAnalyzer.priceFeeds(WETH_TOKEN));
        
        console.log("   USDC feed configured:", usdcFeed == USDC_USD_FEED ? "YES" : "NO");
        console.log("   WAVAX feed configured:", wavaxFeed == AVAX_USD_FEED ? "YES" : "NO");
        console.log("   WETH feed configured:", wethFeed == ETH_USD_FEED ? "YES" : "NO");
    }
}