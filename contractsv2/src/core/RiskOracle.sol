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
    mapping(address => DataTypes.RiskProvider) public riskProviders;
    mapping(address => DataTypes.RiskData[]) public riskHistory;

    event RiskDataSubmitted(address indexed protocol, address indexed provider, uint256 overallRisk);
    event RiskProviderAdded(address indexed provider);
    event RiskProviderRemoved(address indexed provider);

    constructor() Ownable(msg.sender) {}

    function submitRiskData(
        address _protocol,
        uint256 _volatilityRisk,
        uint256 _liquidityRisk,
        uint256 _smartContractRisk,
        uint256 _governanceRisk,
        uint256 _externalRisk
    ) external override nonReentrant {
        require(riskProviders[msg.sender].providerAddress != address(0), "Not a risk provider");
        require(_volatilityRisk <= 10000 && _liquidityRisk <= 10000 &&
                _smartContractRisk <= 10000 && _governanceRisk <= 10000 &&
                _externalRisk <= 10000, "Risk scores must be <= 10000");

        DataTypes.RiskData memory newData = DataTypes.RiskData({
            volatilityRisk: _volatilityRisk,
            liquidityRisk: _liquidityRisk,
            smartContractRisk: _smartContractRisk,
            governanceRisk: _governanceRisk,
            externalRisk: _externalRisk,
            overallRisk: RiskCalculations.calculateOracleRisk(
                _volatilityRisk,
                _liquidityRisk,
                _smartContractRisk,
                _governanceRisk,
                _externalRisk
            ),
            timestamp: block.timestamp
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

        emit RiskDataSubmitted(_protocol, msg.sender, newData.overallRisk);
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
        uint256[] memory volatilityScores = new uint256[](100);
        uint256[] memory liquidityScores = new uint256[](100);
        uint256[] memory smartContractScores = new uint256[](100);
        uint256[] memory governanceScores = new uint256[](100);
        uint256[] memory externalScores = new uint256[](100);

        for (uint256 i = 0; i < 100; i++) {
            address provider = address(uint160(i));
            if (riskProviders[provider].providerAddress != address(0)) {
                DataTypes.RiskData memory data = protocolRiskData[_protocol][provider];
                if (data.timestamp > 0 && block.timestamp - data.timestamp <= 1 days) {
                    volatilityScores[providerCount] = data.volatilityRisk;
                    liquidityScores[providerCount] = data.liquidityRisk;
                    smartContractScores[providerCount] = data.smartContractRisk;
                    governanceScores[providerCount] = data.governanceRisk;
                    externalScores[providerCount] = data.externalRisk;
                    providerCount++;
                }
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

    function addRiskProvider(address _provider, uint256 _reliabilityScore) external override onlyOwner {
        require(_provider != address(0), "Invalid provider address");
        require(riskProviders[_provider].providerAddress == address(0), "Provider already exists");
        require(_reliabilityScore <= 100, "Reliability score must be <= 100");

        riskProviders[_provider] = DataTypes.RiskProvider({
            providerAddress: _provider,
            reliabilityScore: _reliabilityScore,
            lastUpdated: block.timestamp
        });

        emit RiskProviderAdded(_provider);
    }

    function removeRiskProvider(address _provider) external override onlyOwner {
        require(riskProviders[_provider].providerAddress != address(0), "Provider does not exist");
        delete riskProviders[_provider];
        emit RiskProviderRemoved(_provider);
    }

    function getRiskHistory(address _protocol) external view override returns (DataTypes.RiskData[] memory) {
        return riskHistory[_protocol];
    }
}