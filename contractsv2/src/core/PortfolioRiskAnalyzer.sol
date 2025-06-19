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

    mapping(address => DataTypes.Position[]) private userPositions;
    mapping(address => AggregatorV3Interface) public priceFeeds;

    event PositionAdded(address indexed user, address protocol, address token, uint256 amount);
    event PositionRemoved(address indexed user, uint256 positionId);
    event PriceFeedUpdated(address indexed token, address priceFeed);

    constructor(address _contractRegistry) Ownable(msg.sender) {
        require(_contractRegistry != address(0), "Invalid contract registry");
        require(_contractRegistry.code.length > 0, "Contract registry must be contract");
        
        contractRegistry = ContractRegistry(_contractRegistry);
    }

    function addPosition(
        address _protocol,
        address _token,
        uint256 _amount
    ) external override nonReentrant {
        require(_amount > 0, "Amount must be positive");
        IRiskRegistry registry = IRiskRegistry(contractRegistry.getContract(RISK_REGISTRY));
        
        // Check if protocol is registered
        (string memory name,,,,,) = registry.protocols(_protocol);
        require(bytes(name).length > 0, "Protocol not registered");
        require(address(priceFeeds[_token]) != address(0), "Price feed not set");

        userPositions[msg.sender].push(DataTypes.Position({
            protocol: _protocol,
            token: _token,
            amount: _amount,
            value: _calculateTokenValue(_token, _amount),
            timestamp: block.timestamp
        }));

        emit PositionAdded(msg.sender, _protocol, _token, _amount);
    }

    function removePosition(uint256 _positionId) external override nonReentrant {
        require(_positionId < userPositions[msg.sender].length, "Invalid position index");
        userPositions[msg.sender][_positionId] = userPositions[msg.sender][userPositions[msg.sender].length - 1];
        userPositions[msg.sender].pop();
        emit PositionRemoved(msg.sender, _positionId);
    }

    function setPriceFeed(address _token, address _priceFeed) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_priceFeed != address(0), "Invalid price feed address");
        require(_priceFeed.code.length > 0, "Price feed must be a contract");
        
        // Validate if it's a valid Chainlink price feed
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

    function calculatePortfolioRisk(address _user) external view override returns (uint256) {
        DataTypes.Position[] memory positions = userPositions[_user];
        if (positions.length == 0) {
            return 0;
        }

        uint256 totalValue = 0;
        uint256 totalRisk = 0;
        IRiskRegistry registry = IRiskRegistry(contractRegistry.getContract(RISK_REGISTRY));

        for (uint256 i = 0; i < positions.length; i++) {
            DataTypes.Position memory position = positions[i];
            
            // Get protocol risk metrics
            (,,,, DataTypes.RiskMetrics memory metrics,) = registry.protocols(position.protocol);
            
            uint256 tokenValue = _calculateTokenValue(position.token, position.amount);
            totalValue += tokenValue;
            totalRisk += metrics.overallRisk * tokenValue;
        }

        uint256 overallRisk = totalValue > 0 ? totalRisk / totalValue : 0;
        
        // Apply diversification bonus
        uint256 diversificationScore = RiskCalculations.calculateDiversificationScore(positions);
        if (diversificationScore > 0) {
            overallRisk = overallRisk * (10000 - diversificationScore / 10) / 10000;
        }

        return overallRisk;
    }

    function getPortfolioAnalysis(address _user) external view override returns (
        PortfolioAnalysis memory
    ) {
        DataTypes.Position[] memory positions = userPositions[_user];
        
        uint256 totalValue = 0;
        uint256 overallRisk = this.calculatePortfolioRisk(_user);
        uint256 diversificationScore = RiskCalculations.calculateDiversificationScore(positions);
        
        // Calculate total value
        for (uint256 i = 0; i < positions.length; i++) {
            totalValue += _calculateTokenValue(positions[i].token, positions[i].amount);
        }

        return PortfolioAnalysis({
            totalValue: totalValue,
            overallRisk: overallRisk,
            diversificationScore: diversificationScore,
            timestamp: block.timestamp,
            isValid: positions.length > 0
        });
    }

    function getUserPositions(address _user) external view override returns (Position[] memory) {
        DataTypes.Position[] memory dataPositions = userPositions[_user];
        Position[] memory interfacePositions = new Position[](dataPositions.length);
        
        for (uint256 i = 0; i < dataPositions.length; i++) {
            interfacePositions[i] = Position({
                protocol: dataPositions[i].protocol,
                token: dataPositions[i].token,
                amount: dataPositions[i].amount,
                value: dataPositions[i].value
            });
        }
        
        return interfacePositions;
    }

    function riskRegistry() external view override returns (address) {
        return contractRegistry.getContract(RISK_REGISTRY);
    }

    function _calculateTokenValue(address _token, uint256 _amount) internal view returns (uint256) {
        AggregatorV3Interface priceFeed = priceFeeds[_token];
        if (address(priceFeed) == address(0)) return 0;
        
        try priceFeed.latestRoundData() returns (
            uint80, int256 price, uint256, uint256, uint80
        ) {
            if (price <= 0) return 0;
            return (_amount * uint256(price)) / 1e8; // Assuming 8 decimals for price feed
        } catch {
            return 0;
        }
    }
}