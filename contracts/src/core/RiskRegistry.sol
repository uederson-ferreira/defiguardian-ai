// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title RiskRegistry
 * @dev Central registry for DeFi protocol risk metrics
 */
contract RiskRegistry is Ownable, ReentrancyGuard, Pausable {
    struct RiskMetrics {
        uint256 liquidityRisk;      // 0-10000 basis points
        uint256 counterpartyRisk;   // 0-10000 basis points
        uint256 smartContractRisk;  // 0-10000 basis points
        uint256 oracleRisk;         // 0-10000 basis points
        uint256 overallRisk;        // 0-10000 basis points
        uint256 lastUpdated;        // timestamp
    }
    
    struct Protocol {
        string name;
        address contractAddress;
        string category;            // lending, dex, derivatives, etc.
        uint256 tvl;                // Total Value Locked in USD
        RiskMetrics riskMetrics;
        bool isActive;
    }
    
    // Protocol registry
    mapping(address => Protocol) public protocols;
    address[] public protocolList;
    
    // Risk assessors
    mapping(address => bool) public riskAssessors;
    
    // Events
    event ProtocolRegistered(address indexed protocolAddress, string name, string category);
    event RiskMetricsUpdated(address indexed protocolAddress, uint256 overallRisk);
    event RiskAssessorAdded(address indexed assessor);
    event RiskAssessorRemoved(address indexed assessor);
    
    // Modifiers
    modifier onlyRiskAssessor() {
        require(riskAssessors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() {
        riskAssessors[msg.sender] = true;
    }
    
    /**
     * @dev Register a new protocol
     */
    function registerProtocol(
        string memory _name,
        address _contractAddress,
        string memory _category,
        uint256 _tvl
    ) external onlyOwner {
        require(_contractAddress != address(0), "Invalid address");
        require(protocols[_contractAddress].contractAddress == address(0), "Protocol already registered");
        
        protocols[_contractAddress] = Protocol({
            name: _name,
            contractAddress: _contractAddress,
            category: _category,
            tvl: _tvl,
            riskMetrics: RiskMetrics({
                liquidityRisk: 0,
                counterpartyRisk: 0,
                smartContractRisk: 0,
                oracleRisk: 0,
                overallRisk: 0,
                lastUpdated: block.timestamp
            }),
            isActive: true
        });
        
        protocolList.push(_contractAddress);
        
        emit ProtocolRegistered(_contractAddress, _name, _category);
    }
    
    /**
     * @dev Update risk metrics for a protocol
     */
    function updateRiskMetrics(
        address _protocolAddress,
        uint256 _liquidityRisk,
        uint256 _counterpartyRisk,
        uint256 _smartContractRisk,
        uint256 _oracleRisk
    ) external onlyRiskAssessor whenNotPaused {
        require(protocols[_protocolAddress].contractAddress != address(0), "Protocol not registered");
        require(_liquidityRisk <= 10000 && _counterpartyRisk <= 10000 && 
                _smartContractRisk <= 10000 && _oracleRisk <= 10000, "Risk values must be <= 10000");
        
        Protocol storage protocol = protocols[_protocolAddress];
        
        protocol.riskMetrics.liquidityRisk = _liquidityRisk;
        protocol.riskMetrics.counterpartyRisk = _counterpartyRisk;
        protocol.riskMetrics.smartContractRisk = _smartContractRisk;
        protocol.riskMetrics.oracleRisk = _oracleRisk;
        
        // Calculate overall risk (weighted average)
        uint256 overallRisk = (
            _liquidityRisk * 30 +
            _counterpartyRisk * 25 +
            _smartContractRisk * 30 +
            _oracleRisk * 15
        ) / 100;
        
        protocol.riskMetrics.overallRisk = overallRisk;
        protocol.riskMetrics.lastUpdated = block.timestamp;
        
        emit RiskMetricsUpdated(_protocolAddress, overallRisk);
    }
    
    /**
     * @dev Add a risk assessor
     */
    function addRiskAssessor(address _assessor) external onlyOwner {
        require(_assessor != address(0), "Invalid address");
        riskAssessors[_assessor] = true;
        emit RiskAssessorAdded(_assessor);
    }
    
    /**
     * @dev Remove a risk assessor
     */
    function removeRiskAssessor(address _assessor) external onlyOwner {
        require(riskAssessors[_assessor], "Not an assessor");
        riskAssessors[_assessor] = false;
        emit RiskAssessorRemoved(_assessor);
    }
    
    /**
     * @dev Get protocol details
     */
    function getProtocolDetails(address _protocolAddress) external view returns (Protocol memory) {
        return protocols[_protocolAddress];
    }
    
    /**
     * @dev Get all protocols
     */
    function getAllProtocols() external view returns (address[] memory) {
        return protocolList;
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}