// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/libraries/RiskCalculations.sol

import "./DataTypes.sol";

library RiskCalculations {
    /**
     * @dev Unified risk calculation formula used across the system
     * @notice Standardized throughout the system for consistency
     * Weights: Volatility 30%, Liquidity 25%, Smart Contract 25%, Governance 20%
     * External Risk is optional (used only in Oracle for external data)
     */
    function calculateOverallRisk(
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 smartContractRisk,
        uint256 governanceRisk,
        uint256 externalRisk
    ) internal pure returns (uint256) {
        // Unified formula - Same weights used in RiskRegistry and RiskOracle
        if (externalRisk == 0) {
            // Version for RiskRegistry (without external risk)
            return (volatilityRisk * 3000 + 
                    liquidityRisk * 2500 + 
                    smartContractRisk * 2500 + 
                    governanceRisk * 2000) / DataTypes.BASIS_POINTS;
        } else {
            // Version for RiskOracle (with external risk)
            // Redistribute weights when external risk is present
            return (volatilityRisk * 2500 + 
                    liquidityRisk * 2000 + 
                    smartContractRisk * 2500 + 
                    governanceRisk * 1500 + 
                    externalRisk * 1500) / DataTypes.BASIS_POINTS;
        }
    }

    /**
     * @dev Simplified version for RiskRegistry
     */
    function calculateRegistryRisk(
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 smartContractRisk,
        uint256 governanceRisk
    ) internal pure returns (uint256) {
        return calculateOverallRisk(volatilityRisk, liquidityRisk, smartContractRisk, governanceRisk, 0);
    }

    /**
     * @dev Complete version for RiskOracle
     */
    function calculateOracleRisk(
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 smartContractRisk,
        uint256 governanceRisk,
        uint256 externalRisk
    ) internal pure returns (uint256) {
        return calculateOverallRisk(volatilityRisk, liquidityRisk, smartContractRisk, governanceRisk, externalRisk);
    }

    /**
     * @dev Calculate diversification score based on positions
     */
    function calculateDiversificationScore(
        DataTypes.Position[] memory positions
    ) internal pure returns (uint256) {
        if (positions.length <= 1) return 0;
        
        // Simple diversification: more protocols = higher score
        uint256 baseScore = positions.length * 1000; // 1000 per protocol
        
        // Cap at reasonable maximum
        if (baseScore > 5000) baseScore = 5000;
        
        return baseScore;
    }

    /**
     * @dev Calculate portfolio weighted risk
     */
    function calculateWeightedRisk(
        uint256[] memory risks,
        uint256[] memory weights
    ) internal pure returns (uint256) {
        require(risks.length == weights.length, "Array length mismatch");
        
        if (risks.length == 0) return 0;
        
        uint256 totalWeightedRisk = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < risks.length; i++) {
            totalWeightedRisk += risks[i] * weights[i];
            totalWeight += weights[i];
        }
        
        return totalWeight > 0 ? totalWeightedRisk / totalWeight : 0;
    }
}