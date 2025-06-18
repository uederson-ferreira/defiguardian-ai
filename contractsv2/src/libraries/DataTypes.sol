// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/libraries/DataTypes.sol

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// ========== DataTypes.sol ==========
library DataTypes {
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant PRECISION = 1e18;
    
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint8 decimals;
        bool isValid;
    }
    
    struct RiskFactors {
        uint256 marketVolatility;
        uint256 liquidityDepth;
        uint256 smartContractRisk;
        uint256 governanceRisk;
        uint256 externalFactors;
    }
    
    struct TokenMetrics {
        address token;
        uint256 totalSupply;
        uint256 marketCap;
        uint256 volume24h;
        uint256 liquidityUSD;
        uint8 decimals;
    }
}