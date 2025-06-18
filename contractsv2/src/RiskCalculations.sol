    /**
     * @dev ✅ CORREÇÃO CRÍTICA: Fórmula unificada para cálculo de risco
     * @notice Padronizado em todo o sistema para consistência
     * Pesos: Volatility 30%, Liquidity 25%, Smart Contract 25%, Governance 20%
     * External Risk é opcional (usado apenas no Oracle para dados externos)
     */
    function calculateOverallRisk(
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 smartContractRisk,
        uint256 governanceRisk,
        uint256 externalRisk
    ) internal pure returns (uint256) {
        // ✅ FÓRMULA UNIFICADA - Mesmo peso usado em RiskRegistry e RiskOracle
        if (externalRisk == 0) {
            // Versão para RiskRegistry (sem external risk)
            return (volatilityRisk * 3000 + 
                    liquidityRisk * 2500 + 
                    smartContractRisk * 2500 + 
                    governanceRisk * 2000) / DataTypes.BASIS_POINTS;
        } else {
            // Versão para RiskOracle (com external risk)
            // Redistribuir pesos quando external risk está presente
            return (volatilityRisk * 2500 + 
                    liquidityRisk * 2000 + 
                    smartContractRisk * 2500 + 
                    governanceRisk * 1500 + 
                    externalRisk * 1500) / DataTypes.BASIS_POINTS;
        }
    }

    /**
     * @dev ✅ NOVA FUNÇÃO: Versão simplificada para RiskRegistry
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
     * @dev ✅ NOVA FUNÇÃO: Versão completa para RiskOracle
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