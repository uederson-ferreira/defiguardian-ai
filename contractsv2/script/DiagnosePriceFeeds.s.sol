// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title DiagnosePriceFeeds
 * @dev Script to diagnose price feed issues
 */
contract DiagnosePriceFeeds is Script {
    // Price feed addresses to test
    address constant USDC_USD_FEED = 0x86d67c3D38D2bCeE722E601025C25a575021c6EA;
    address constant AVAX_USD_FEED = 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD;
    address constant ETH_USD_FEED = 0x86d67c3D38D2bCeE722E601025C25a575021c6EA;
    
    function run() external view {
        console.log("=== PRICE FEED DIAGNOSIS ===");
        
        // Test each price feed
        testPriceFeed("USDC/USD (ETH/USD fallback)", USDC_USD_FEED);
        testPriceFeed("AVAX/USD", AVAX_USD_FEED);
        testPriceFeed("ETH/USD", ETH_USD_FEED);
    }
    
    function testPriceFeed(string memory name, address feedAddress) internal view {
        console.log("\n--- Testing", name, "---");
        console.log("Address:", feedAddress);
        
        // Check if address has code
        if (feedAddress.code.length == 0) {
            console.log("ERROR: Address has no code (not a contract)");
            return;
        }
        console.log("OK: Address has code");
        
        // Try to call latestRoundData
        try AggregatorV3Interface(feedAddress).latestRoundData() returns (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            console.log("OK: latestRoundData() call successful");
            console.log("  Round ID:", roundId);
            console.log("  Price:", uint256(price));
            console.log("  Updated At:", updatedAt);
            
            if (price <= 0) {
                console.log("ERROR: Price is zero or negative");
            } else {
                console.log("OK: Price is valid");
            }
            
            // Check if price is recent (within last 24 hours)
            if (block.timestamp - updatedAt > 86400) {
                console.log("WARNING: Price data is older than 24 hours");
            } else {
                console.log("OK: Price data is recent");
            }
            
        } catch Error(string memory reason) {
            console.log("ERROR: latestRoundData() failed with reason:", reason);
        } catch {
            console.log("ERROR: latestRoundData() failed with unknown error");
        }
        
        // Try to get decimals
        try AggregatorV3Interface(feedAddress).decimals() returns (uint8 decimals) {
            console.log("OK: Decimals:", decimals);
        } catch {
            console.log("ERROR: Could not get decimals");
        }
    }
}