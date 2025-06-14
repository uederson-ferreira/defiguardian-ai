// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title RiskRegistry
 * @dev Core registry for risk metrics and protocols
 */
contract RiskRegistry is Ownable(msg.sender), Pausable {
    struct RiskMetrics {
        uint256 volatilityScore;     // 0-10000 (basis points)
        uint256 liquidityScore;      // 0-10000 
        uint256 smartContractScore;  // 0-10000
        uint256 governanceScore;     // 0-10000
        uint256 overallRisk;         // Calculated composite score
        uint256 lastUpdated;
        bool isActive;
    }

    struct Protocol {
        string name;
        address protocolAddress;
        string category;             // "lending", "dex", "staking", etc
        uint256 tvl;                // Total Value Locked
        RiskMetrics riskMetrics;
        bool isWhitelisted;
    }

    // Protocol registry
    mapping(address => Protocol) public protocols;
    mapping(bytes32 => address) public protocolsByName;
    address[] public allProtocols;

    // Risk assessors (authorized addresses that can update risk metrics)
    mapping(address => bool) public riskAssessors;

    // Events
    event ProtocolRegistered(address indexed protocolAddress, string name);
    event RiskMetricsUpdated(address indexed protocolAddress, uint256 overallRisk);
    event RiskAssessorAdded(address indexed assessor);
    event RiskAssessorRemoved(address indexed assessor);

    modifier onlyRiskAssessor() {
        require(riskAssessors[msg.sender] || msg.sender == owner(), "Not authorized assessor");
        _;
    }

    constructor() {
        riskAssessors[msg.sender] = true;
    }

    /**
     * @dev Register a new protocol for risk assessment
     */
    function registerProtocol(
        address _protocolAddress,
        string memory _name,
        string memory _category
    ) external onlyOwner {
        require(_protocolAddress != address(0), "Invalid address");
        require(bytes(_name).length > 0, "Name required");
        
        bytes32 nameHash = keccak256(abi.encodePacked(_name));
        require(protocolsByName[nameHash] == address(0), "Protocol name exists");

        protocols[_protocolAddress] = Protocol({
            name: _name,
            protocolAddress: _protocolAddress,
            category: _category,
            tvl: 0,
            riskMetrics: RiskMetrics({
                volatilityScore: 5000,      // Default medium risk
                liquidityScore: 5000,
                smartContractScore: 5000,
                governanceScore: 5000,
                overallRisk: 5000,
                lastUpdated: block.timestamp,
                isActive: true
            }),
            isWhitelisted: false
        });

        protocolsByName[nameHash] = _protocolAddress;
        allProtocols.push(_protocolAddress);

        emit ProtocolRegistered(_protocolAddress, _name);
    }

    /**
     * @dev Update risk metrics for a protocol
     */
    function updateRiskMetrics(
        address _protocolAddress,
        uint256 _volatilityScore,
        uint256 _liquidityScore,
        uint256 _smartContractScore,
        uint256 _governanceScore
    ) external onlyRiskAssessor whenNotPaused {
        require(protocols[_protocolAddress].protocolAddress != address(0), "Protocol not registered");
        require(_volatilityScore <= 10000 && _liquidityScore <= 10000 && 
                _smartContractScore <= 10000 && _governanceScore <= 10000, "Scores must be <= 10000");

        Protocol storage protocol = protocols[_protocolAddress];
        
        protocol.riskMetrics.volatilityScore = _volatilityScore;
        protocol.riskMetrics.liquidityScore = _liquidityScore;
        protocol.riskMetrics.smartContractScore = _smartContractScore;
        protocol.riskMetrics.governanceScore = _governanceScore;
        
        // Calculate composite risk score (weighted average)
        uint256 overallRisk = (_volatilityScore * 30 + _liquidityScore * 25 + 
                              _smartContractScore * 25 + _governanceScore * 20) / 100;
        
        protocol.riskMetrics.overallRisk = overallRisk;
        protocol.riskMetrics.lastUpdated = block.timestamp;

        emit RiskMetricsUpdated(_protocolAddress, overallRisk);
    }

    /**
     * @dev Add a new risk assessor
     */
    function addRiskAssessor(address _assessor) external onlyOwner {
        riskAssessors[_assessor] = true;
        emit RiskAssessorAdded(_assessor);
    }

    /**
     * @dev Remove a risk assessor
     */
    function removeRiskAssessor(address _assessor) external onlyOwner {
        riskAssessors[_assessor] = false;
        emit RiskAssessorRemoved(_assessor);
    }

    /**
     * @dev Get protocol details
     */
    function getProtocol(address _protocolAddress) external view returns (Protocol memory) {
        return protocols[_protocolAddress];
    }

    /**
     * @dev Get all registered protocols
     */
    function getAllProtocols() external view returns (address[] memory) {
        return allProtocols;
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}