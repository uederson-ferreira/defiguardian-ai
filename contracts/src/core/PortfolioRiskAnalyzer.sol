// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./RiskRegistry.sol";

/**
 * @title PortfolioRiskAnalyzer
 * @dev Analyzes risk for DeFi portfolios
 */
contract PortfolioRiskAnalyzer is Ownable(msg.sender), ReentrancyGuard {
    RiskRegistry public immutable riskRegistry;
    
    struct Position {
        address protocol;
        address token;
        uint256 amount;
        uint256 value;           // USD value
    }

    struct PortfolioAnalysis {
        uint256 totalValue;
        uint256 overallRisk;
        uint256 diversificationScore;
        uint256 timestamp;
        bool isValid;
    }

    // User portfolios
    mapping(address => Position[]) public userPositions;
    mapping(address => PortfolioAnalysis) public portfolioAnalyses;

    // Chainlink price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds;

    event PortfolioUpdated(address indexed user, uint256 totalValue, uint256 riskScore);
    event PositionAdded(address indexed user, address protocol, address token, uint256 amount);
    event PositionRemoved(address indexed user, uint256 positionIndex);

    constructor(address _riskRegistry) {
        riskRegistry = RiskRegistry(_riskRegistry);
    }

    /**
     * @dev Add a position to user's portfolio
     */
    function addPosition(
        address _protocol,
        address _token,
        uint256 _amount
    ) external nonReentrant {
        require(_amount > 0, "Amount must be positive");
        
        // Verify protocol is registered
        (,address protocolAddr,,,,) = riskRegistry.protocols(_protocol);
        require(protocolAddr != address(0), "Protocol not registered");

        uint256 value = _getTokenValue(_token, _amount);
        
        userPositions[msg.sender].push(Position({
            protocol: _protocol,
            token: _token,
            amount: _amount,
            value: value
        }));

        emit PositionAdded(msg.sender, _protocol, _token, _amount);
        
        // Trigger portfolio analysis update
        _updatePortfolioAnalysis(msg.sender);
    }

    /**
     * @dev Remove a position from user's portfolio
     */
    function removePosition(uint256 _positionIndex) external {
        require(_positionIndex < userPositions[msg.sender].length, "Invalid position index");
        
        // Move last element to deleted spot and pop
        userPositions[msg.sender][_positionIndex] = userPositions[msg.sender][userPositions[msg.sender].length - 1];
        userPositions[msg.sender].pop();

        emit PositionRemoved(msg.sender, _positionIndex);
        
        // Update analysis
        _updatePortfolioAnalysis(msg.sender);
    }

    /**
     * @dev Get user's portfolio positions
     */
    function getUserPositions(address _user) external view returns (Position[] memory) {
        return userPositions[_user];
    }

    /**
     * @dev Get portfolio analysis for user
     */
    function getPortfolioAnalysis(address _user) external view returns (PortfolioAnalysis memory) {
        return portfolioAnalyses[_user];
    }

    /**
     * @dev Calculate portfolio risk score
     */
    function calculatePortfolioRisk(address _user) external view returns (uint256) {
        Position[] memory positions = userPositions[_user];
        if (positions.length == 0) return 0;

        uint256 totalValue = 0;
        uint256 weightedRisk = 0;

        for (uint256 i = 0; i < positions.length; i++) {
            Position memory pos = positions[i];
            
            // Get protocol risk from registry
            (,,,,RiskRegistry.RiskMetrics memory metrics,) = riskRegistry.protocols(pos.protocol);
            
            totalValue += pos.value;
            weightedRisk += (pos.value * metrics.overallRisk);
        }

        if (totalValue == 0) return 0;
        
        uint256 portfolioRisk = weightedRisk / totalValue;
        
        // Apply diversification bonus (reduce risk for diversified portfolios)
        uint256 diversificationBonus = _calculateDiversificationBonus(positions);
        portfolioRisk = portfolioRisk > diversificationBonus ? portfolioRisk - diversificationBonus : 0;
        
        return portfolioRisk;
    }

    /**
     * @dev Internal function to update portfolio analysis
     */
    function _updatePortfolioAnalysis(address _user) internal {
        Position[] memory positions = userPositions[_user];
        
        uint256 totalValue = 0;
        for (uint256 i = 0; i < positions.length; i++) {
            totalValue += positions[i].value;
        }

        uint256 riskScore = this.calculatePortfolioRisk(_user);
        uint256 diversificationScore = _calculateDiversificationScore(positions);

        portfolioAnalyses[_user] = PortfolioAnalysis({
            totalValue: totalValue,
            overallRisk: riskScore,
            diversificationScore: diversificationScore,
            timestamp: block.timestamp,
            isValid: true
        });

        emit PortfolioUpdated(_user, totalValue, riskScore);
    }

    /**
     * @dev Calculate diversification score (0-10000)
     */
    function _calculateDiversificationScore(Position[] memory _positions) internal view returns (uint256) {
        if (_positions.length <= 1) return 0;
        if (_positions.length >= 10) return 10000; // Max diversification
        
        // Count unique protocols and categories
        uint256 uniqueProtocols = _countUniqueProtocols(_positions);
        uint256 uniqueCategories = _countUniqueCategories(_positions);
        
        // Score based on number of unique protocols and categories
        uint256 protocolScore = (uniqueProtocols * 1000) > 10000 ? 10000 : uniqueProtocols * 1000;
        uint256 categoryScore = (uniqueCategories * 1500) > 10000 ? 10000 : uniqueCategories * 1500;
        
        return (protocolScore + categoryScore) / 2;
    }

    /**
     * @dev Calculate diversification bonus for risk reduction
     */
    function _calculateDiversificationBonus(Position[] memory _positions) internal view returns (uint256) {
        uint256 diversificationScore = _calculateDiversificationScore(_positions);
        // Bonus up to 1000 basis points (10% risk reduction)
        return (diversificationScore * 1000) / 10000;
    }

    /**
     * @dev Count unique protocols in positions
     */
    function _countUniqueProtocols(Position[] memory _positions) internal pure returns (uint256) {
        if (_positions.length == 0) return 0;
        
        address[] memory uniqueProtocols = new address[](_positions.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _positions.length; i++) {
            bool isUnique = true;
            for (uint256 j = 0; j < count; j++) {
                if (uniqueProtocols[j] == _positions[i].protocol) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) {
                uniqueProtocols[count] = _positions[i].protocol;
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Count unique categories in positions
     */
    function _countUniqueCategories(Position[] memory _positions) internal view returns (uint256) {
        if (_positions.length == 0) return 0;
        
        string[] memory uniqueCategories = new string[](_positions.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _positions.length; i++) {
            (,, string memory category,,,) = riskRegistry.protocols(_positions[i].protocol);
            
            bool isUnique = true;
            for (uint256 j = 0; j < count; j++) {
                if (keccak256(abi.encodePacked(uniqueCategories[j])) == keccak256(abi.encodePacked(category))) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) {
                uniqueCategories[count] = category;
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Get token value using Chainlink price feeds
     */
    function _getTokenValue(address _token, uint256 _amount) internal view returns (uint256) {
        AggregatorV3Interface priceFeed = priceFeeds[_token];
        if (address(priceFeed) == address(0)) return 0;
        
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        
        // Assuming 18 decimals for simplicity, adjust as needed
        return (_amount * uint256(price)) / 1e18;
    }

    /**
     * @dev Set price feed for a token (only owner)
     */
    function setPriceFeed(address _token, address _priceFeed) external onlyOwner {
        priceFeeds[_token] = AggregatorV3Interface(_priceFeed);
    }
}