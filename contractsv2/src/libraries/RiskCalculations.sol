// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {DataTypes} from "../libraries/DataTypes.sol";
/**
 * @title RiskCalculations
 * @dev Library for risk calculations
 */
library RiskCalculations {
    using DataTypes for *;
    
    /**
 * @dev Calculates overall risk based on multiple factors
 */
    function calculateOverallRisk(
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 smartContractRisk,
        uint256 governanceRisk,
        uint256 externalRisk
    ) internal pure returns (uint256) {
        // Weights: Volatility 25%, Liquidity 20%, Smart Contract 25%, Governance 15%, External 15%
        return (volatilityRisk * 2500 + 
                liquidityRisk * 2000 + 
                smartContractRisk * 2500 + 
                governanceRisk * 1500 + 
                externalRisk * 1500) / DataTypes.BASIS_POINTS;
    }
    
    /**
     * @dev Calculates volatility risk based on price history
     */
    function calculateVolatilityRisk(uint256[] memory priceHistory) internal pure returns (uint256) {
        if (priceHistory.length < 2) return 5000; // Medium risk by default
        
        uint256 volatility = _calculateStandardDeviation(priceHistory);
        uint256 mean = _calculateMean(priceHistory);
        
        if (mean == 0) return 5000;
        
        uint256 coefficientOfVariation = (volatility * DataTypes.BASIS_POINTS) / mean;
        
        // Normalize to 0-10000 range
        return coefficientOfVariation > DataTypes.BASIS_POINTS ? DataTypes.BASIS_POINTS : coefficientOfVariation;
    }
    
    /**
     * @dev Calculates liquidity risk based on TVL and volume
     */
    function calculateLiquidityRisk(uint256 tvl, uint256 volume24h) internal pure returns (uint256) {
        if (tvl == 0) return 9000; // High risk if there's no TVL
        
        uint256 liquidityRatio = (volume24h * DataTypes.BASIS_POINTS) / tvl;
        
        // Higher volume/TVL = lower liquidity risk
        if (liquidityRatio >= 1000) return 1000;      // < 10% risk
        if (liquidityRatio >= 500) return 3000;       // 30% risk  
        if (liquidityRatio >= 100) return 5000;       // 50% risk
        if (liquidityRatio >= 50) return 7000;        // 70% risk
        return 9000;                                   // 90% risk
    }
    
    /**
     * @dev Calculates diversification score
     */
    function calculateDiversificationScore(
        address[] memory protocols,
        string[] memory categories,
        uint256[] memory values
    ) internal pure returns (uint256) {
        if (protocols.length <= 1) return 0;
        
        uint256 uniqueProtocols = _countUniqueAddresses(protocols);
        uint256 uniqueCategories = _countUniqueStrings(categories);
        uint256 concentrationRisk = _calculateConcentrationRisk(values);
        
        uint256 protocolScore = (uniqueProtocols * 3000) / protocols.length;
        uint256 categoryScore = (uniqueCategories * 4000) / protocols.length;
        uint256 concentrationScore = DataTypes.BASIS_POINTS - concentrationRisk;
        
        return (protocolScore + categoryScore + concentrationScore) / 3;
    }
    
    /**
     * @dev Calculates standard deviation
     */
    function _calculateStandardDeviation(uint256[] memory values) private pure returns (uint256) {
        uint256 mean = _calculateMean(values);
        uint256 squaredDiffSum = 0;
        
        for (uint256 i = 0; i < values.length; i++) {
            uint256 diff = values[i] > mean ? values[i] - mean : mean - values[i];
            squaredDiffSum += diff * diff;
        }
        
        return _sqrt(squaredDiffSum / values.length);
    }
    
    /**
     * @dev Calculates mean
     */
    function _calculateMean(uint256[] memory values) private pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < values.length; i++) {
            sum += values[i];
        }
        return sum / values.length;
    }
    
    /**
     * @dev Calculates square root
     */
    function _sqrt(uint256 x) private pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    /**
     * @dev Counts unique addresses
     */
    function _countUniqueAddresses(address[] memory addresses) private pure returns (uint256) {
        uint256 unique = 0;
        for (uint256 i = 0; i < addresses.length; i++) {
            bool isUnique = true;
            for (uint256 j = 0; j < i; j++) {
                if (addresses[i] == addresses[j]) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) unique++;
        }
        return unique;
    }
    
    /**
     * @dev Counts unique strings
     */
    function _countUniqueStrings(string[] memory strings) private pure returns (uint256) {
        uint256 unique = 0;
        for (uint256 i = 0; i < strings.length; i++) {
            bool isUnique = true;
            for (uint256 j = 0; j < i; j++) {
                if (keccak256(bytes(strings[i])) == keccak256(bytes(strings[j]))) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) unique++;
        }
        return unique;
    }
    
    /**
     * @dev Calculates concentration risk
     */
    function _calculateConcentrationRisk(uint256[] memory values) private pure returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < values.length; i++) {
            totalValue += values[i];
        }
        
        if (totalValue == 0) return DataTypes.BASIS_POINTS;
        
        uint256 maxConcentration = 0;
        for (uint256 i = 0; i < values.length; i++) {
            uint256 concentration = (values[i] * DataTypes.BASIS_POINTS) / totalValue;
            if (concentration > maxConcentration) {
                maxConcentration = concentration;
            }
        }
        
        return maxConcentration;
    }
}
