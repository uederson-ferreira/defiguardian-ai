// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/interfaces/IRiskOracle.sol

import "../libraries/DataTypes.sol";
// ========== IRiskOracle.sol ==========
interface IRiskOracle {
    // struct RiskData {
    //     uint256 volatilityRisk;
    //     uint256 liquidityRisk;
    //     uint256 smartContractRisk;
    //     uint256 governanceRisk;
    //     uint256 externalRisk;
    //     uint256 overallRisk; 
    //     uint256 timestamp;
    //     address reporter;
    //     bool isValid;
    // }

    function getAggregatedRisk(address _protocol) external view returns (
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 smartContractRisk,
        uint256 governanceRisk,
        uint256 externalRisk,
        uint256 overallRisk,
        uint256 timestamp
    );
    
    function submitRiskData(address _protocol, uint256 _volatility, uint256 _liquidity, uint256 _smartContract, uint256 _governance, uint256 _external) external;
    function addRiskProvider(address _provider, string memory _name, uint256 _weight) external;
    function isRiskDataFresh(address _protocol) external view returns (bool);
    
    // ✅ MÉTODOS FALTANDO ADICIONADOS:
    function getAllProviders() external view returns (address[] memory);
    function setRiskThreshold(address _protocol, uint256 _threshold) external;
    function getRiskHistory(address _protocol) external view returns (DataTypes.RiskData[] memory);
    function getRiskTrend(address _protocol) external view returns (int256);
    function updateProvider(address _provider, uint256 _newWeight, uint256 _newReputation) external;
    function deactivateProvider(address _provider) external;
    
    // Getters para dados públicos
    function riskProviders(address provider) external view returns (
        string memory name,
        address providerAddress,
        uint256 weight,
        uint256 reputation,
        bool isActive,
        uint256 totalReports,
        uint256 accurateReports
    );
    function allProviders(uint256 index) external view returns (address);
    function riskThresholds(address protocol) external view returns (uint256);
}