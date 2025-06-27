// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";

/**
 * @title ConfigureWAVAXPriceFeed
 * @dev Script para configurar especificamente o price feed do WAVAX
 */
contract ConfigureWAVAXPriceFeed is Script {
    PortfolioRiskAnalyzer public analyzer;
    
    // Contract address on Avalanche Fuji
    address constant ANALYZER_ADDRESS = 0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192;
    
    // Token and price feed addresses on Avalanche Fuji
    address constant WAVAX = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c;
    address constant AVAX_USD_FEED = 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD;
    
    function run() external {
        vm.startBroadcast();
        
        analyzer = PortfolioRiskAnalyzer(ANALYZER_ADDRESS);
        
        console.log("=== CONFIGURING WAVAX PRICE FEED ===\n");
        console.log("Analyzer Address:", ANALYZER_ADDRESS);
        console.log("WAVAX Token:", WAVAX);
        console.log("AVAX/USD Feed:", AVAX_USD_FEED);
        
        // Check if price feed is already set
        address currentFeed = address(analyzer.priceFeeds(WAVAX));
        if (currentFeed != address(0)) {
            console.log("Current WAVAX price feed:", currentFeed);
            if (currentFeed == AVAX_USD_FEED) {
                console.log("WAVAX price feed already correctly configured!");
                vm.stopBroadcast();
                return;
            }
        } else {
            console.log("No price feed currently set for WAVAX");
        }
        
        // Configure WAVAX price feed
        try analyzer.setPriceFeed(WAVAX, AVAX_USD_FEED) {
            console.log("SUCCESS: WAVAX price feed configured");
            
            // Verify configuration
            address configuredFeed = address(analyzer.priceFeeds(WAVAX));
            console.log("Verified WAVAX price feed:", configuredFeed);
            
            // Test the price feed
            try analyzer.priceFeeds(WAVAX).latestRoundData() returns (
                uint80 roundId,
                int256 price,
                uint256 startedAt,
                uint256 updatedAt,
                uint80 answeredInRound
            ) {
                console.log("WAVAX Price:", uint256(price));
                console.log("Last Updated:", updatedAt);
                console.log("Round ID:", roundId);
            } catch Error(string memory reason) {
                console.log("FAILED to get WAVAX price:", reason);
            }
            
        } catch Error(string memory reason) {
            console.log("FAILED to configure WAVAX price feed:", reason);
        } catch {
            console.log("FAILED to configure WAVAX price feed: unknown error");
        }
        
        vm.stopBroadcast();
    }
}