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
    mapping(string => bool) private protocolNames; // Track unique names
    
    address[] private allProtocols;

    event ProtocolRegistered(address indexed protocolAddress, string name);
    event RiskMetricsUpdated(address indexed protocolAddress, uint256 overallRisk);
    event RiskAssessorAdded(address indexed assessor);
    event RiskAssessorRemoved(address indexed assessor);

    modifier onlyRiskAssessor() {
        require(riskAssessors[msg.sender], "Not authorized assessor");
        _;
    }

    constructor() Ownable(msg.sender) {
        riskAssessors[msg.sender] = true;
    }

    function registerProtocol(
        address _protocolAddress,
        string memory _name,
        string memory _category
    ) external override onlyOwner whenNotPaused {
        require(_protocolAddress != address(0), "Invalid address");
        require(bytes(_name).length > 0, "Name required");
        require(protocols[_protocolAddress].protocolAddress == address(0), "Protocol already registered");
        require(!protocolNames[_name], "Protocol name exists");

        DataTypes.RiskMetrics memory metrics = DataTypes.RiskMetrics({
            volatilityScore: 5000,    // Default medium risk
            liquidityScore: 5000,
            smartContractScore: 5000,
            governanceScore: 5000,
            overallRisk: 5000,
            lastUpdated: block.timestamp,
            isActive: true
        });

        protocols[_protocolAddress] = DataTypes.Protocol({
            name: _name,
            protocolAddress: _protocolAddress,
            category: _category,
            tvl: 0,
            riskMetrics: metrics,
            isWhitelisted: false
        });

        protocolNames[_name] = true;
        allProtocols.push(_protocolAddress);

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
        protocol.riskMetrics.overallRisk = RiskCalculations.calculateRegistryRisk(
            _volatilityScore,
            _liquidityScore,
            _smartContractScore,
            _governanceScore
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

    function getAllProtocols() external view override returns (address[] memory) {
        return allProtocols;
    }

    function getProtocol(address _protocolAddress) external view returns (DataTypes.Protocol memory) {
        return protocols[_protocolAddress];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}