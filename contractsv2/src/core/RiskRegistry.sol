// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/core/RiskRegistry.sol

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "../libraries/RiskCalculations.sol";
import "../libraries/DataTypes.sol";
import "../interfaces/IRiskRegistry.sol";

contract RiskRegistry is IRiskRegistry, Ownable, Pausable {
    using RiskCalculations for *;

    mapping(address => DataTypes.Protocol) public override protocols;
    mapping(address => bool) public riskAssessors;

    event ProtocolRegistered(address indexed protocolAddress, string name);
    event RiskMetricsUpdated(address indexed protocolAddress, uint256 overallRisk);
    event RiskAssessorAdded(address indexed assessor);
    event RiskAssessorRemoved(address indexed assessor);

    modifier onlyRiskAssessor() {
        require(riskAssessors[msg.sender], "Not a risk assessor");
        _;
    }

    constructor() Ownable(msg.sender) {
        riskAssessors[msg.sender] = true;
    }

    function registerProtocol(
        address _protocolAddress,
        string memory _name,
        string memory _category,
        uint256 _initialVolatilityScore,
        uint256 _initialLiquidityScore,
        uint256 _initialSmartContractScore,
        uint256 _initialGovernanceScore
    ) external override onlyOwner whenNotPaused {
        require(_protocolAddress != address(0), "Invalid protocol address");
        require(protocols[_protocolAddress].protocolAddress == address(0), "Protocol already registered");
        require(_initialVolatilityScore <= 10000 && _initialLiquidityScore <= 10000 &&
                _initialSmartContractScore <= 10000 && _initialGovernanceScore <= 10000, "Scores must be <= 10000");

        DataTypes.RiskMetrics memory metrics = DataTypes.RiskMetrics({
            volatilityScore: _initialVolatilityScore,
            liquidityScore: _initialLiquidityScore,
            smartContractScore: _initialSmartContractScore,
            governanceScore: _initialGovernanceScore,
            overallRisk: RiskCalculations.calculateRegistryRisk(
                _initialVolatilityScore,
                _initialLiquidityScore,
                _initialSmartContractScore,
                _initialGovernanceScore
            ),
            lastUpdated: block.timestamp
        });

        protocols[_protocolAddress] = DataTypes.Protocol({
            protocolAddress: _protocolAddress,
            name: _name,
            category: _category,
            riskMetrics: metrics
        });

        emit ProtocolRegistered(_protocolAddress, _name);
    }

    function updateRiskMetrics(
        address _protocolAddress,
        uint256 _volatilityScore,
        uint256 _liquidityScore,
        uint256 _smartContractScore,
        uint256 _governanceScore
    ) external override onlyRiskAssessor whenNotPaused {
        require(protocols[_protocolAddress].protocolAddress != address(0), "Protocol not registered");
        require(_volatilityScore <= 10000 && _liquidityScore <= 10000 &&
                _smartContractScore <= 10000 && _governanceScore <= 10000, "Scores must be <= 10000");

        DataTypes.Protocol storage protocol = protocols[_protocolAddress];
        protocol.riskMetrics.volatilityScore = _volatilityScore;
        protocol.riskMetrics.liquidityScore = _liquidityScore;
        protocol.riskMetrics.smartContractScore = _smartContractScore;
        protocol.riskMetrics.governanceScore = _governanceScore;
        protocol.riskMetrics.overallRisk = RiskCalculations.calculateOverallRisk(
            _volatilityScore,
            _liquidityScore,
            _smartContractScore,
            _governanceScore,
            0 // externalRisk não usado
        );
        protocol.riskMetrics.lastUpdated = block.timestamp;

        emit RiskMetricsUpdated(_protocolAddress, protocol.riskMetrics.overallRisk);
    }

    function addRiskAssessor(address _assessor) external onlyOwner {
        require(_assessor != address(0), "Invalid address");
        require(!riskAssessors[_assessor], "Assessor already added");
        riskAssessors[_assessor] = true;
        emit RiskAssessorAdded(_assessor);
    }

    function removeRiskAssessor(address _assessor) external onlyOwner {
        require(riskAssessors[_assessor], "Assessor not found");
        riskAssessors[_assessor] = false;
        emit RiskAssessorRemoved(_assessor);
    }

    function getAllProtocols() external view override returns (DataTypes.Protocol[] memory) {
        // Implementação existente
        uint256 count = 0;
        for (uint256 i = 0; i < 100; i++) {
            if (protocols[address(uint160(i))].protocolAddress != address(0)) {
                count++;
            }
        }
        DataTypes.Protocol[] memory result = new DataTypes.Protocol[](count);
        count = 0;
        for (uint256 i = 0; i < 100; i++) {
            if (protocols[address(uint160(i))].protocolAddress != address(0)) {
                result[count] = protocols[address(uint160(i))];
                count++;
            }
        }
        return result;
    }
}