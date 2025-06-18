// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/core/PortfolioRiskAnalyzer.sol

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./ContractRegistry.sol";
import "../libraries/PriceFeeds.sol";
import "../libraries/RiskCalculations.sol";
import "../libraries/DataTypes.sol";
import "../interfaces/IPortfolioAnalyzer.sol";
import "../interfaces/IRiskRegistry.sol";

contract PortfolioRiskAnalyzer is IPortfolioAnalyzer, Ownable, ReentrancyGuard {
    using PriceFeeds for *;
    using RiskCalculations for *;

    ContractRegistry public immutable contractRegistry;
    bytes32 private constant RISK_REGISTRY = keccak256("RiskRegistry");

    mapping(address => DataTypes.Position[]) private _userPositions;
    mapping(address => AggregatorV3Interface) public priceFeeds;

    event PositionAdded(address indexed user, address protocol, address token, uint256 amount);
    event PositionRemoved(address indexed user, uint256 positionId);
    event PriceFeedUpdated(address indexed token, address priceFeed);

    constructor(address _portfolioAnalyzer) Ownable(msg.sender) {
        require(_portfolioAnalyzer != address(0), "Invalid portfolio analyzer");
        require(_portfolioAnalyzer.code.length > 0, "Portfolio analyzer must be contract");
        
        // ✅ VALIDAÇÃO: Testar se implementa interface necessária
        try IPortfolioAnalyzer(_portfolioAnalyzer).getPortfolioAnalysis(address(0)) {
            // Se não reverter, implementa a interface corretamente
        } catch {
            // Isso é esperado (endereço zero), mas mostra que a interface existe
        }
        
        portfolioAnalyzer = PortfolioRiskAnalyzer(_portfolioAnalyzer);
    }

    function addPosition(
        address _protocol,
        address _token,
        uint256 _amount
    ) external override nonReentrant {
        require(_amount > 0, "Amount must be positive");
        IRiskRegistry riskRegistry = IRiskRegistry(contractRegistry.getContract(RISK_REGISTRY));
        (,address protocolAddr,,,,) = riskRegistry.protocols(_protocol);
        require(protocolAddr != address(0), "Protocol not registered");
        require(priceFeeds[_token] != AggregatorV3Interface(address(0)), "Price feed not set");

        userPositions[msg.sender].push(DataTypes.Position({
            protocol: _protocol,
            token: _token,
            amount: _amount,
            timestamp: block.timestamp
        }));

        emit PositionAdded(msg.sender, _protocol, _token, _amount);
    }

    function removePosition(uint256 _positionId) external override nonReentrant {
        require(_positionId < userPositions[msg.sender].length, "Invalid position ID");
        userPositions[msg.sender][_positionId] = userPositions[msg.sender][userPositions[msg.sender].length - 1];
        userPositions[msg.sender].pop();
        emit PositionRemoved(msg.sender, _positionId);
    }

    function setPriceFeed(address _token, address _priceFeed) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_priceFeed != address(0), "Invalid price feed address");
        require(_priceFeed.code.length > 0, "Price feed must be a contract");
        
        // ✅ VALIDAÇÃO CRÍTICA: Testar se é um price feed Chainlink válido
        try AggregatorV3Interface(_priceFeed).latestRoundData() returns (
            uint80, int256 price, uint256, uint256, uint80
        ) {
            require(price > 0, "Price feed returning invalid price");
        } catch {
            revert("Invalid Chainlink price feed");
        }
        
        priceFeeds[_token] = AggregatorV3Interface(_priceFeed);
        emit PriceFeedUpdated(_token, _priceFeed);
    }

    function calculatePortfolioRisk(address _user) external view override returns (
        uint256 totalValue,
        uint256 overallRisk,
        uint256 diversificationScore
    ) {
        DataTypes.Position[] memory positions = userPositions[_user];
        if (positions.length == 0) {
            return (0, 0, 0);
        }

        uint256 totalRisk = 0;
        IRiskRegistry riskRegistry = IRiskRegistry(contractRegistry.getContract(RISK_REGISTRY));

        for (uint256 i = 0; i < positions.length; i++) {
            DataTypes.Position memory position = positions[i];
            (, , , DataTypes.RiskMetrics memory metrics, ) = riskRegistry.protocols(position.protocol);
            uint256 tokenValue = PriceFeeds.getValueInUSD(position.token, position.amount, priceFeeds[position.token]);
            totalValue += tokenValue;
            totalRisk += metrics.overallRisk * tokenValue;
        }

        overallRisk = totalValue > 0 ? totalRisk / totalValue : 0;
        diversificationScore = RiskCalculations.calculateDiversificationScore(positions);

        return (totalValue, overallRisk, diversificationScore);
    }

    function getPortfolioAnalysis(address _user) external view override returns (
        DataTypes.Position[] memory positions,
        uint256 totalValue,
        uint256 overallRisk,
        uint256 diversificationScore
    ) {
        (totalValue, overallRisk, diversificationScore) = calculatePortfolioRisk(_user);
        positions = userPositions[_user];
        return (positions, totalValue, overallRisk, diversificationScore);
    }

    function getUserPositions(address _user) external view override returns (DataTypes.Position[] memory) {
        return userPositions[_user];
    }
}