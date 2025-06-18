// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./DataTypes.sol";

// ========== PriceFeeds.sol ==========
library PriceFeeds {
    using DataTypes for *;
    
    struct Feed {
        AggregatorV3Interface aggregator;
        uint8 decimals;
        uint256 heartbeat; // Max time between updates
        bool isActive;
    }
    
    error StalePrice(address feed, uint256 lastUpdate);
    error InvalidPrice(address feed, int256 price);
    error InactiveFeed(address feed);
    
    /**
     * @dev Gets current price with validations
     */
    function getPrice(Feed memory feed) internal view returns (DataTypes.PriceData memory) {
        if (!feed.isActive) revert InactiveFeed(address(feed.aggregator));
        
        (
            uint80 roundId,
            int256 price,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = feed.aggregator.latestRoundData();
        
        // Validate if price is not stale
        if (block.timestamp - updatedAt > feed.heartbeat) {
            revert StalePrice(address(feed.aggregator), updatedAt);
        }
        
        // Validate if price is positive
        if (price <= 0) {
            revert InvalidPrice(address(feed.aggregator), price);
        }
        
        // Validate data integrity
        require(roundId > 0 && answeredInRound >= roundId, "Invalid round data");
        
        return DataTypes.PriceData({
            price: uint256(price),
            timestamp: updatedAt,
            decimals: feed.decimals,
            isValid: true
        });
    }
    
    /**
     * @dev Gets historical price
     */
    function getHistoricalPrice(
        Feed memory feed,
        uint80 roundId
    ) internal view returns (DataTypes.PriceData memory) {
        if (!feed.isActive) revert InactiveFeed(address(feed.aggregator));
        
        (
            ,
            int256 price,
            ,
            uint256 updatedAt,
            // Removed unused variable answeredInRound
        ) = feed.aggregator.getRoundData(roundId);
        
        if (price <= 0) {
            revert InvalidPrice(address(feed.aggregator), price);
        }
        
        return DataTypes.PriceData({
            price: uint256(price),
            timestamp: updatedAt,
            decimals: feed.decimals,
            isValid: true
        });
    }
    
    /**
     * @dev Converts value between tokens using price feeds
     */
    function convertValue(
        uint256 amount,
        Feed memory fromFeed,
        Feed memory toFeed
    ) internal view returns (uint256) {
        DataTypes.PriceData memory fromPrice = getPrice(fromFeed);
        DataTypes.PriceData memory toPrice = getPrice(toFeed);
        
        // Normalize to same precision
        uint256 normalizedFromPrice = fromPrice.price * (10 ** (18 - fromPrice.decimals));
        uint256 normalizedToPrice = toPrice.price * (10 ** (18 - toPrice.decimals));
        
        return (amount * normalizedFromPrice) / normalizedToPrice;
    }
    
    /**
     * @dev Calculates value in USD
     */
    function getValueInUSD(
        uint256 amount,
        Feed memory tokenFeed,
        uint8 tokenDecimals
    ) internal view returns (uint256) {
        DataTypes.PriceData memory price = getPrice(tokenFeed);
        
        // Adjust for token decimals
        uint256 adjustedAmount = amount;
        if (tokenDecimals < 18) {
            adjustedAmount = amount * (10 ** (18 - tokenDecimals));
        } else if (tokenDecimals > 18) {
            adjustedAmount = amount / (10 ** (tokenDecimals - 18));
        }
        
        // Calculate USD value (assuming price feed in USD with 8 decimals)
        return (adjustedAmount * price.price) / (10 ** price.decimals);
    }
}