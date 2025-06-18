// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ========== IRiskRegistry.sol ==========
interface IRiskRegistry {
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

    function protocols(address) external view returns (
        string memory name,
        address protocolAddress,
        string memory category,
        uint256 tvl,
        RiskMetrics memory riskMetrics,
        bool isWhitelisted
    );
    
    function registerProtocol(address _protocolAddress, string memory _name, string memory _category) external;
    function updateRiskMetrics(address _protocolAddress, uint256 _volatility, uint256 _liquidity, uint256 _smartContract, uint256 _governance) external;
    function getAllProtocols() external view returns (address[] memory);
}