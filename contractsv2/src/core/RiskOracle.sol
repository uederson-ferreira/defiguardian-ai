// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/core/RiskOracle.sol

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "../libraries/RiskCalculations.sol";
import "../libraries/DataTypes.sol";
import "../interfaces/IRiskOracle.sol";

contract RiskOracle is IRiskOracle, Ownable, ReentrancyGuard {
    using RiskCalculations for *;

    mapping(address => mapping(address => DataTypes.RiskData)) public protocolRiskData;
    mapping(address => DataTypes.RiskProvider) private _riskProviders;
    
    function riskProviders(address provider) external view override returns (
        string memory name,
        address providerAddress,
        uint256 weight,
        uint256 reputation,
        bool isActive,
        uint256 totalReports,
        uint256 accurateReports
    ) {
        DataTypes.RiskProvider memory rp = _riskProviders[provider];
        return (
            rp.name,
            rp.providerAddress,
            rp.weight,
            rp.reputation,
            rp.isActive,
            rp.totalReports,
            rp.accurateReports
        );
    }
    mapping(address => DataTypes.RiskData[]) public riskHistory;
    mapping(address => uint256) public override riskThresholds;
    
    address[] public override allProviders;

    event RiskDataSubmitted(address indexed protocol, address indexed provider, uint256 overallRisk);
    event RiskProviderAdded(address indexed provider);
    event RiskProviderRemoved(address indexed provider);
    event RiskThresholdUpdated(address indexed protocol, uint256 threshold);

    constructor() Ownable(msg.sender) {}

    function submitRiskData(
        address _protocol,
        uint256 _volatilityRisk,
        uint256 _liquidityRisk,
        uint256 _smartContractRisk,
        uint256 _governanceRisk,
        uint256 _externalRisk
    ) external override nonReentrant {
        require(_riskProviders[msg.sender].providerAddress != address(0), "Not a risk provider");
        require(_volatilityRisk <= 10000 && _liquidityRisk <= 10000 &&
                _smartContractRisk <= 10000 && _governanceRisk <= 10000 &&
                _externalRisk <= 10000, "Risk scores must be <= 10000");

        uint256 overallRisk = RiskCalculations.calculateOracleRisk(
            _volatilityRisk,
            _liquidityRisk,
            _smartContractRisk,
            _governanceRisk,
            _externalRisk
        );

        DataTypes.RiskData memory newData = DataTypes.RiskData({
            volatilityRisk: _volatilityRisk,
            liquidityRisk: _liquidityRisk,
            smartContractRisk: _smartContractRisk,
            governanceRisk: _governanceRisk,
            externalRisk: _externalRisk,
            overallRisk: overallRisk,
            timestamp: block.timestamp,
            reporter: msg.sender,
            isValid: true
        });

        protocolRiskData[_protocol][msg.sender] = newData;

        if (riskHistory[_protocol].length >= 30) {
            for (uint256 i = 0; i < riskHistory[_protocol].length - 1; i++) {
                riskHistory[_protocol][i] = riskHistory[_protocol][i + 1];
            }
            riskHistory[_protocol][riskHistory[_protocol].length - 1] = newData;
        } else {
            riskHistory[_protocol].push(newData);
        }

        emit RiskDataSubmitted(_protocol, msg.sender, overallRisk);
    }

    function getAggregatedRisk(
        address _protocol
    ) external view override returns (
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 smartContractRisk,
        uint256 governanceRisk,
        uint256 externalRisk,
        uint256 overallRisk,
        uint256 timestamp
    ) {
        uint256 providerCount = 0;
        uint256[] memory volatilityScores = new uint256[](allProviders.length);
        uint256[] memory liquidityScores = new uint256[](allProviders.length);
        uint256[] memory smartContractScores = new uint256[](allProviders.length);
        uint256[] memory governanceScores = new uint256[](allProviders.length);
        uint256[] memory externalScores = new uint256[](allProviders.length);

        for (uint256 i = 0; i < allProviders.length; i++) {
            address provider = allProviders[i];
            DataTypes.RiskData memory data = protocolRiskData[_protocol][provider];
            
            if (data.timestamp > 0 && block.timestamp - data.timestamp <= 1 days && data.isValid) {
                volatilityScores[providerCount] = data.volatilityRisk;
                liquidityScores[providerCount] = data.liquidityRisk;
                smartContractScores[providerCount] = data.smartContractRisk;
                governanceScores[providerCount] = data.governanceRisk;
                externalScores[providerCount] = data.externalRisk;
                providerCount++;
            }
        }

        if (providerCount == 0) {
            return (0, 0, 0, 0, 0, 0, 0);
        }

        volatilityRisk = _calculateAverage(volatilityScores, providerCount);
        liquidityRisk = _calculateAverage(liquidityScores, providerCount);
        smartContractRisk = _calculateAverage(smartContractScores, providerCount);
        governanceRisk = _calculateAverage(governanceScores, providerCount);
        externalRisk = _calculateAverage(externalScores, providerCount);
        overallRisk = RiskCalculations.calculateOverallRisk(
            volatilityRisk,
            liquidityRisk,
            smartContractRisk,
            governanceRisk,
            externalRisk
        );
        timestamp = block.timestamp;

        return (
            volatilityRisk,
            liquidityRisk,
            smartContractRisk,
            governanceRisk,
            externalRisk,
            overallRisk,
            timestamp
        );
    }

    function _calculateAverage(uint256[] memory _scores, uint256 _count) internal pure returns (uint256) {
        if (_count == 0) return 0;
        uint256 sum = 0;
        for (uint256 i = 0; i < _count; i++) {
            sum += _scores[i];
        }
        return sum / _count;
    }

    function addRiskProvider(address _provider, string memory _name, uint256 _weight) external override onlyOwner {
        require(_provider != address(0), "Invalid provider address");
        require(_riskProviders[_provider].providerAddress == address(0), "Provider already exists");
        require(_weight <= 10000, "Weight must be <= 10000");

        _riskProviders[_provider] = DataTypes.RiskProvider({
            name: _name,
            providerAddress: _provider,
            weight: _weight,
            reputation: 5000, // Default 50%
            isActive: true,
            totalReports: 0,
            accurateReports: 0,
            reliabilityScore: _weight,
            lastUpdated: block.timestamp
        });

        allProviders.push(_provider);
        emit RiskProviderAdded(_provider);
    }

    function setRiskThreshold(address _protocol, uint256 _threshold) external override onlyOwner {
        require(_threshold <= 10000, "Threshold must be <= 10000");
        riskThresholds[_protocol] = _threshold;
        emit RiskThresholdUpdated(_protocol, _threshold);
    }

    function isRiskDataFresh(address _protocol) external view override returns (bool) {
        for (uint256 i = 0; i < allProviders.length; i++) {
            address provider = allProviders[i];
            DataTypes.RiskData memory data = protocolRiskData[_protocol][provider];
            if (data.timestamp > 0 && block.timestamp - data.timestamp <= 1 days) {
                return true;
            }
        }
        return false;
    }

    function getRiskHistory(address _protocol) external view override returns (DataTypes.RiskData[] memory) {
        DataTypes.RiskData[] memory internalHistory = riskHistory[_protocol];
        DataTypes.RiskData[] memory interfaceHistory = new DataTypes.RiskData[](internalHistory.length);
        
        for (uint256 i = 0; i < internalHistory.length; i++) {
            interfaceHistory[i] = DataTypes.RiskData({
                volatilityRisk: internalHistory[i].volatilityRisk,
                liquidityRisk: internalHistory[i].liquidityRisk,
                smartContractRisk: internalHistory[i].smartContractRisk,
                governanceRisk: internalHistory[i].governanceRisk,
                externalRisk: internalHistory[i].externalRisk,
                overallRisk: internalHistory[i].overallRisk,
                timestamp: internalHistory[i].timestamp,
                reporter: internalHistory[i].reporter,
                isValid: internalHistory[i].isValid
            });
        }
        
        return interfaceHistory;
    }

    function getAllProviders() external view override returns (address[] memory) {
        return allProviders;
    }

    function getRiskTrend(address _protocol) external view override returns (int256) {
        DataTypes.RiskData[] memory history = riskHistory[_protocol];
        if (history.length < 2) return 0;
        
        uint256 latest = history[history.length - 1].overallRisk;
        uint256 previous = history[history.length - 2].overallRisk;
        
        return int256(latest) - int256(previous);
    }

    function updateProvider(address _provider, uint256 _newWeight, uint256 _newReputation) external override onlyOwner {
        require(_riskProviders[_provider].providerAddress != address(0), "Provider does not exist");
        require(_newWeight <= 10000, "Weight must be <= 10000");
        require(_newReputation <= 10000, "Reputation must be <= 10000");
        
        _riskProviders[_provider].weight = _newWeight;
        _riskProviders[_provider].reputation = _newReputation;
        _riskProviders[_provider].lastUpdated = block.timestamp;
    }

    function deactivateProvider(address _provider) external override onlyOwner {
        require(_riskProviders[_provider].providerAddress != address(0), "Provider does not exist");
        _riskProviders[_provider].isActive = false;
        _riskProviders[_provider].lastUpdated = block.timestamp;
    }
}