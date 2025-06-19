// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/libraries/DataTypes.sol

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

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

    struct RiskMetrics {
        uint256 volatilityScore;
        uint256 liquidityScore;
        uint256 smartContractScore;
        uint256 governanceScore;
        uint256 overallRisk;
        uint256 lastUpdated;
        bool isActive;
    }

    struct Protocol {
        string name;
        address protocolAddress;
        string category;
        uint256 tvl;
        RiskMetrics riskMetrics;
        bool isWhitelisted;
    }

    struct Position {
        address protocol;
        address token;
        uint256 amount;
        uint256 value;
        uint256 timestamp;
    }

    struct PortfolioAnalysis {
        uint256 totalValue;
        uint256 overallRisk;
        uint256 diversificationScore;
        uint256 timestamp;
        bool isValid;
    }

    struct RiskData {
        uint256 volatilityRisk;
        uint256 liquidityRisk;
        uint256 smartContractRisk;
        uint256 governanceRisk;
        uint256 externalRisk;
        uint256 overallRisk;
        uint256 timestamp;
        address reporter;
        bool isValid;
    }

    struct RiskProvider {
        string name;              // Name of the provider
        address providerAddress;  // Address of the provider
        uint256 weight;           // Weight in the risk calculation (up to 10000 basis points)
        uint256 reputation;       // Reputation score (up to 10000 basis points)
        bool isActive;            // Whether the provider is active
        uint256 totalReports;     // Total number of reports submitted
        uint256 accurateReports;  // Number of accurate reports
        uint256 reliabilityScore; // Reliability score
        uint256 lastUpdated;      // Last update timestamp
    }
}