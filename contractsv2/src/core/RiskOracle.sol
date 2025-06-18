// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title RiskOracle
 * @dev Oracle for aggregating risk data from multiple sources
 */
contract RiskOracle is Ownable, ReentrancyGuard {
    
    struct RiskData {
        uint256 volatilityRisk;      // Market volatility risk (0-10000)
        uint256 liquidityRisk;       // Liquidity risk (0-10000)
        uint256 smartContractRisk;   // Technical risk (0-10000)
        uint256 governanceRisk;      // Governance risk (0-10000)
        uint256 externalRisk;        // External factors (0-10000)
        uint256 timestamp;
        address reporter;
        bool isValid;
    }

    struct RiskProvider {
        string name;
        address providerAddress;
        uint256 weight;              // Weight in final calculation (0-10000)
        uint256 reputation;          // Provider reputation score (0-10000)
        bool isActive;
        uint256 totalReports;
        uint256 accurateReports;
    }

    // Protocol address => RiskData from multiple providers
    mapping(address => mapping(address => RiskData)) public protocolRiskData;
    
    // Protocol address => aggregated final risk
    mapping(address => RiskData) public aggregatedRisk;
    
    // Risk data providers
    mapping(address => RiskProvider) public riskProviders;
    address[] public allProviders;
    
    // Risk thresholds for automated alerts
    mapping(address => uint256) public riskThresholds;
    
    // Historical risk data (last 30 entries)
    mapping(address => RiskData[]) public riskHistory;
    uint256 public constant MAX_HISTORY = 30;
    
    // Events
    event RiskDataSubmitted(address indexed protocol, address indexed provider, uint256 overallRisk);
    event RiskAggregated(address indexed protocol, uint256 newRisk, uint256 oldRisk);
    event ProviderAdded(address indexed provider, string name, uint256 weight);
    event ProviderUpdated(address indexed provider, uint256 newWeight, uint256 newReputation);
    event RiskThresholdExceeded(address indexed protocol, uint256 riskLevel, uint256 threshold);

    // ✅ CONSTRUTOR CORRIGIDO
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Add a new risk data provider
     */
    function addRiskProvider(
        address _provider,
        string memory _name,
        uint256 _weight
    ) external onlyOwner {
        require(_provider != address(0), "Invalid provider address");
        require(_weight <= 10000, "Weight too high");
        require(!riskProviders[_provider].isActive, "Provider already exists");

        riskProviders[_provider] = RiskProvider({
            name: _name,
            providerAddress: _provider,
            weight: _weight,
            reputation: 5000, // Start with medium reputation
            isActive: true,
            totalReports: 0,
            accurateReports: 0
        });

        allProviders.push(_provider);
        emit ProviderAdded(_provider, _name, _weight);
    }

    /**
     * @dev Submit risk data for a protocol (only approved providers)
     */
    function submitRiskData(
        address _protocol,
        uint256 _volatilityRisk,
        uint256 _liquidityRisk,
        uint256 _smartContractRisk,
        uint256 _governanceRisk,
        uint256 _externalRisk
    ) external nonReentrant {
        require(riskProviders[msg.sender].isActive, "Not an approved provider");
        require(_protocol != address(0), "Invalid protocol");
        require(
            _volatilityRisk <= 10000 && _liquidityRisk <= 10000 && 
            _smartContractRisk <= 10000 && _governanceRisk <= 10000 &&
            _externalRisk <= 10000,
            "Risk values must be <= 10000"
        );

        // Store individual provider data
        protocolRiskData[_protocol][msg.sender] = RiskData({
            volatilityRisk: _volatilityRisk,
            liquidityRisk: _liquidityRisk,
            smartContractRisk: _smartContractRisk,
            governanceRisk: _governanceRisk,
            externalRisk: _externalRisk,
            timestamp: block.timestamp,
            reporter: msg.sender,
            isValid: true
        });

        // Update provider stats
        riskProviders[msg.sender].totalReports++;

        // Calculate overall risk for this submission
        uint256 overallRisk = (_volatilityRisk * 25 + _liquidityRisk * 20 + 
                              _smartContractRisk * 25 + _governanceRisk * 15 + 
                              _externalRisk * 15) / 100;

        emit RiskDataSubmitted(_protocol, msg.sender, overallRisk);

        // Trigger aggregation
        _aggregateRiskData(_protocol);
    }

    /**
     * @dev Aggregate risk data from multiple providers
     */
    function _aggregateRiskData(address _protocol) internal {
        uint256 totalWeight = 0;
        uint256 weightedVolatility = 0;
        uint256 weightedLiquidity = 0;
        uint256 weightedSmartContract = 0;
        uint256 weightedGovernance = 0;
        uint256 weightedExternal = 0;
        
        uint256 oldRisk = aggregatedRisk[_protocol].isValid ? 
            _calculateOverallRisk(aggregatedRisk[_protocol]) : 0;

        // Aggregate data from all active providers
        for (uint256 i = 0; i < allProviders.length; i++) {
            address provider = allProviders[i];
            RiskProvider memory providerInfo = riskProviders[provider];
            
            if (!providerInfo.isActive) continue;
            
            RiskData memory data = protocolRiskData[_protocol][provider];
            if (!data.isValid || block.timestamp - data.timestamp > 7 days) continue;
            
            // Weight by provider weight and reputation
            uint256 effectiveWeight = (providerInfo.weight * providerInfo.reputation) / 10000;
            
            totalWeight += effectiveWeight;
            weightedVolatility += data.volatilityRisk * effectiveWeight;
            weightedLiquidity += data.liquidityRisk * effectiveWeight;
            weightedSmartContract += data.smartContractRisk * effectiveWeight;
            weightedGovernance += data.governanceRisk * effectiveWeight;
            weightedExternal += data.externalRisk * effectiveWeight;
        }

        if (totalWeight == 0) return; // No valid data

        // Calculate aggregated risk
        RiskData memory newAggregatedRisk = RiskData({
            volatilityRisk: weightedVolatility / totalWeight,
            liquidityRisk: weightedLiquidity / totalWeight,
            smartContractRisk: weightedSmartContract / totalWeight,
            governanceRisk: weightedGovernance / totalWeight,
            externalRisk: weightedExternal / totalWeight,
            timestamp: block.timestamp,
            reporter: address(this),
            isValid: true
        });

        // Store aggregated result
        aggregatedRisk[_protocol] = newAggregatedRisk;
        
        // Add to history
        _addToHistory(_protocol, newAggregatedRisk);

        uint256 newRisk = _calculateOverallRisk(newAggregatedRisk);
        emit RiskAggregated(_protocol, newRisk, oldRisk);

        // Check threshold alerts
        _checkRiskThreshold(_protocol, newRisk);
    }

    /**
     * @dev Calculate overall risk score
     */
    function _calculateOverallRisk(RiskData memory _data) internal pure returns (uint256) {
        return (_data.volatilityRisk * 25 + _data.liquidityRisk * 20 + 
                _data.smartContractRisk * 25 + _data.governanceRisk * 15 + 
                _data.externalRisk * 15) / 100;
    }

    /**
     * @dev Add risk data to historical records
     */
    function _addToHistory(address _protocol, RiskData memory _data) internal {
        riskHistory[_protocol].push(_data);
        
        // Keep only last 30 entries
        if (riskHistory[_protocol].length > MAX_HISTORY) {
            // Shift array left
            for (uint256 i = 0; i < MAX_HISTORY - 1; i++) {
                riskHistory[_protocol][i] = riskHistory[_protocol][i + 1];
            }
            riskHistory[_protocol].pop();
        }
    }

    /**
     * @dev Check if risk exceeds threshold and emit alert
     */
    function _checkRiskThreshold(address _protocol, uint256 _riskLevel) internal {
        uint256 threshold = riskThresholds[_protocol];
        if (threshold > 0 && _riskLevel > threshold) {
            emit RiskThresholdExceeded(_protocol, _riskLevel, threshold);
        }
    }

    /**
     * @dev Get aggregated risk for a protocol
     */
    function getAggregatedRisk(address _protocol) external view returns (
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 smartContractRisk,
        uint256 governanceRisk,
        uint256 externalRisk,
        uint256 overallRisk,
        uint256 timestamp
    ) {
        RiskData memory data = aggregatedRisk[_protocol];
        require(data.isValid, "No risk data available");
        
        return (
            data.volatilityRisk,
            data.liquidityRisk,
            data.smartContractRisk,
            data.governanceRisk,
            data.externalRisk,
            _calculateOverallRisk(data),
            data.timestamp
        );
    }

    /**
     * @dev Get risk history for a protocol
     */
    function getRiskHistory(address _protocol) external view returns (RiskData[] memory) {
        return riskHistory[_protocol];
    }

    /**
     * @dev Get risk trend (increase/decrease over time)
     */
    function getRiskTrend(address _protocol) external view returns (int256) {
        RiskData[] memory history = riskHistory[_protocol];
        if (history.length < 2) return 0;
        
        uint256 latestRisk = _calculateOverallRisk(history[history.length - 1]);
        uint256 previousRisk = _calculateOverallRisk(history[history.length - 2]);
        
        return int256(latestRisk) - int256(previousRisk);
    }

    /**
     * @dev Set risk threshold for automated alerts
     */
    function setRiskThreshold(address _protocol, uint256 _threshold) external onlyOwner {
        require(_threshold <= 10000, "Threshold too high");
        riskThresholds[_protocol] = _threshold;
    }

    /**
     * @dev Update provider weight and reputation
     */
    function updateProvider(
        address _provider,
        uint256 _newWeight,
        uint256 _newReputation
    ) external onlyOwner {
        require(riskProviders[_provider].isActive, "Provider not active");
        require(_newWeight <= 10000 && _newReputation <= 10000, "Values too high");
        
        riskProviders[_provider].weight = _newWeight;
        riskProviders[_provider].reputation = _newReputation;
        
        emit ProviderUpdated(_provider, _newWeight, _newReputation);
    }

    /**
     * @dev Deactivate a risk provider
     */
    function deactivateProvider(address _provider) external onlyOwner {
        riskProviders[_provider].isActive = false;
    }

    /**
     * @dev Get all risk providers
     */
    function getAllProviders() external view returns (address[] memory) {
        return allProviders;
    }

    /**
     * @dev Check if risk data is fresh (updated within last 24 hours)
     */
    function isRiskDataFresh(address _protocol) external view returns (bool) {
        RiskData memory data = aggregatedRisk[_protocol];
        return data.isValid && (block.timestamp - data.timestamp <= 24 hours);
    }
}