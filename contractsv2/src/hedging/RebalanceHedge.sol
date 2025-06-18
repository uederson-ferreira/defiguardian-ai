// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/hedging/RebalanceHedge.sol

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RebalanceHedge
 * @dev Specific contract for automatic portfolio rebalancing
 * @notice Automatically maintains desired proportions between different assets
 */
contract RebalanceHedge is ReentrancyGuard, Ownable {
    
    struct Portfolio {
        address[] tokens;           // List of tokens in the portfolio
        uint256[] targetWeights;    // Desired weights (in basis points)
        uint256[] currentAmounts;   // Current amounts of each token
        uint256 rebalanceThreshold; // Threshold for rebalancing (in basis points)
        uint256 lastRebalance;      // Timestamp of the last rebalance
        uint256 rebalanceInterval;  // Minimum interval between rebalances
        bool isActive;              // Portfolio status
    }
    
    struct TokenInfo {
        AggregatorV3Interface priceFeed;
        uint8 decimals;
        bool isSupported;
    }
    
    // Mappings
    mapping(address => Portfolio) public portfolios;
    mapping(address => TokenInfo) public tokenInfo;
    
    // Arrays for iteration
    address[] public activeUsers;
    address[] public supportedTokens;
    
    // Configurations
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_TOKENS = 10;
    uint256 public minRebalanceInterval = 1 hours;
    uint256 public rebalanceFee = 0.002 ether;
    
    // Events
    event PortfolioCreated(
        address indexed user,
        address[] tokens,
        uint256[] weights
    );
    
    event PortfolioRebalanced(
        address indexed user,
        uint256[] oldAmounts,
        uint256[] newAmounts,
        uint256 totalValueUSD
    );
    
    event TokenAdded(
        address indexed token,
        address indexed priceFeed
    );
    
    event RebalanceThresholdReached(
        address indexed user,
        uint256 maxDeviation
    );
    
    // ✅ CORREÇÃO: Adicionar Ownable(msg.sender) no construtor
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Adds support for a new token
     */
    function addSupportedToken(
        address token,
        address priceFeed,
        uint8 decimals
    ) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(priceFeed != address(0), "Invalid price feed");
        
        if (!tokenInfo[token].isSupported) {
            supportedTokens.push(token);
        }
        
        tokenInfo[token] = TokenInfo({
            priceFeed: AggregatorV3Interface(priceFeed),
            decimals: decimals,
            isSupported: true
        });
        
        emit TokenAdded(token, priceFeed);
    }
    
    /**
     * @dev Creates a new portfolio for automatic rebalancing
     */
    function createPortfolio(
        address[] calldata tokens,
        uint256[] calldata weights,
        uint256[] calldata amounts,
        uint256 rebalanceThreshold
    ) external payable nonReentrant {
        require(msg.value >= rebalanceFee, "Insufficient fee");
        require(tokens.length == weights.length, "Arrays length mismatch");
        require(tokens.length == amounts.length, "Arrays length mismatch");
        require(tokens.length <= MAX_TOKENS, "Too many tokens");
        require(rebalanceThreshold > 0 && rebalanceThreshold <= 2000, "Invalid threshold"); // Max 20%
        
        // Checks if weights sum to 100%
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            require(tokenInfo[tokens[i]].isSupported, "Token not supported");
            require(weights[i] > 0, "Weight must be positive");
            totalWeight += weights[i];
        }
        require(totalWeight == BASIS_POINTS, "Weights must sum to 100%");
        
        // Transfers tokens to the contract
        for (uint256 i = 0; i < tokens.length; i++) {
            require(amounts[i] > 0, "Amount must be positive");
            IERC20(tokens[i]).transferFrom(msg.sender, address(this), amounts[i]);
        }
        
        // Creates the portfolio
        portfolios[msg.sender] = Portfolio({
            tokens: tokens,
            targetWeights: weights,
            currentAmounts: amounts,
            rebalanceThreshold: rebalanceThreshold,
            lastRebalance: block.timestamp,
            rebalanceInterval: minRebalanceInterval,
            isActive: true
        });
        
        // Adds user to the active list
        activeUsers.push(msg.sender);
        
        emit PortfolioCreated(msg.sender, tokens, weights);
    }
    
    /**
     * @dev Calculates if a portfolio needs rebalancing
     */
    function checkRebalanceNeeded(address user) public view returns (
        bool needsRebalance,
        uint256 maxDeviation,
        uint256[] memory currentWeights,
        uint256 totalValueUSD
    ) {
        Portfolio memory portfolio = portfolios[user];
        
        if (!portfolio.isActive || 
            block.timestamp < portfolio.lastRebalance + portfolio.rebalanceInterval) {
            return (false, 0, new uint256[](0), 0);
        }
        
        // Calculates total value and current weights
        (totalValueUSD, currentWeights) = calculateCurrentWeights(user);
        
        if (totalValueUSD == 0) {
            return (false, 0, currentWeights, totalValueUSD);
        }
        
        // Checks maximum deviation
        maxDeviation = 0;
        for (uint256 i = 0; i < portfolio.targetWeights.length; i++) {
            uint256 deviation = _calculateDeviation(currentWeights[i], portfolio.targetWeights[i]);
            if (deviation > maxDeviation) {
                maxDeviation = deviation;
            }
        }
        
        needsRebalance = maxDeviation >= portfolio.rebalanceThreshold;
        
        return (needsRebalance, maxDeviation, currentWeights, totalValueUSD);
    }
    
    /**
     * @dev Executes portfolio rebalancing
     */
    function executeRebalance(address user) external nonReentrant {
        Portfolio storage portfolio = portfolios[user];
        require(portfolio.isActive, "Portfolio not active");
        
        (bool needsRebalance, uint256 maxDeviation, , uint256 totalValueUSD) = checkRebalanceNeeded(user);
        require(needsRebalance, "Rebalance not needed");
        
        uint256[] memory oldAmounts = new uint256[](portfolio.tokens.length);
        uint256[] memory newAmounts = new uint256[](portfolio.tokens.length);
        
        // Saves old values
        for (uint256 i = 0; i < portfolio.tokens.length; i++) {
            oldAmounts[i] = portfolio.currentAmounts[i];
        }
        
        // Calculates new values based on desired weights
        for (uint256 i = 0; i < portfolio.tokens.length; i++) {
            uint256 tokenPrice = getTokenPrice(portfolio.tokens[i]);
            uint256 targetValueUSD = (totalValueUSD * portfolio.targetWeights[i]) / BASIS_POINTS;
            uint256 tokenDecimals = tokenInfo[portfolio.tokens[i]].decimals;
            
            newAmounts[i] = (targetValueUSD * (10 ** tokenDecimals)) / tokenPrice;
            portfolio.currentAmounts[i] = newAmounts[i];
        }
        
        portfolio.lastRebalance = block.timestamp;
        
        emit PortfolioRebalanced(user, oldAmounts, newAmounts, totalValueUSD);
        emit RebalanceThresholdReached(user, maxDeviation);
    }
    
    /**
     * @dev Calculates current portfolio weights
     */
    function calculateCurrentWeights(address user) public view returns (
        uint256 totalValueUSD,
        uint256[] memory currentWeights
    ) {
        Portfolio memory portfolio = portfolios[user];
        currentWeights = new uint256[](portfolio.tokens.length);
        
        // Calculates total value in USD
        uint256[] memory tokenValuesUSD = new uint256[](portfolio.tokens.length);
        for (uint256 i = 0; i < portfolio.tokens.length; i++) {
            uint256 tokenPrice = getTokenPrice(portfolio.tokens[i]);
            uint256 tokenDecimals = tokenInfo[portfolio.tokens[i]].decimals;
            tokenValuesUSD[i] = (portfolio.currentAmounts[i] * tokenPrice) / (10 ** tokenDecimals);
            totalValueUSD += tokenValuesUSD[i];
        }
        
        // Calculates current weights
        if (totalValueUSD > 0) {
            for (uint256 i = 0; i < portfolio.tokens.length; i++) {
                currentWeights[i] = (tokenValuesUSD[i] * BASIS_POINTS) / totalValueUSD;
            }
        }
        
        return (totalValueUSD, currentWeights);
    }
    
    /**
     * @dev Gets the price of a token in USD
     */
    function getTokenPrice(address token) public view returns (uint256) {
        require(tokenInfo[token].isSupported, "Token not supported");
        
        AggregatorV3Interface priceFeed = tokenInfo[token].priceFeed;
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        
        return uint256(price);
    }
    
    /**
     * @dev Calculates the percentage deviation between two values
     */
    function _calculateDeviation(uint256 current, uint256 target) internal pure returns (uint256) {
        if (target == 0) return 0;
        
        if (current > target) {
            return ((current - target) * BASIS_POINTS) / target;
        } else {
            return ((target - current) * BASIS_POINTS) / target;
        }
    }
    
    /**
     * @dev Allows the user to deposit more tokens into the portfolio
     */
    function depositToPortfolio(
        address token,
        uint256 amount
    ) external nonReentrant {
        Portfolio storage portfolio = portfolios[msg.sender];
        require(portfolio.isActive, "Portfolio not active");
        
        // Checks if the token is part of the portfolio
        bool tokenFound = false;
        uint256 tokenIndex;
        for (uint256 i = 0; i < portfolio.tokens.length; i++) {
            if (portfolio.tokens[i] == token) {
                tokenFound = true;
                tokenIndex = i;
                break;
            }
        }
        require(tokenFound, "Token not in portfolio");
        
        // Transfers tokens
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        portfolio.currentAmounts[tokenIndex] += amount;
    }
    
    /**
     * @dev Allows the user to withdraw tokens from the portfolio
     */
    function withdrawFromPortfolio(
        address token,
        uint256 amount
    ) external nonReentrant {
        Portfolio storage portfolio = portfolios[msg.sender];
        require(portfolio.isActive, "Portfolio not active");
        
        // Checks if the token is part of the portfolio
        bool tokenFound = false;
        uint256 tokenIndex;
        for (uint256 i = 0; i < portfolio.tokens.length; i++) {
            if (portfolio.tokens[i] == token) {
                tokenFound = true;
                tokenIndex = i;
                break;
            }
        }
        require(tokenFound, "Token not in portfolio");
        require(portfolio.currentAmounts[tokenIndex] >= amount, "Insufficient balance");
        
        // Transfers tokens
        portfolio.currentAmounts[tokenIndex] -= amount;
        IERC20(token).transfer(msg.sender, amount);
    }
    
    /**
     * @dev Deactivates a portfolio and withdraws all tokens
     */
    function closePortfolio() external nonReentrant {
        Portfolio storage portfolio = portfolios[msg.sender];
        require(portfolio.isActive, "Portfolio not active");
        
        portfolio.isActive = false;
        
        // Returns all tokens
        for (uint256 i = 0; i < portfolio.tokens.length; i++) {
            if (portfolio.currentAmounts[i] > 0) {
                IERC20(portfolio.tokens[i]).transfer(msg.sender, portfolio.currentAmounts[i]);
                portfolio.currentAmounts[i] = 0;
            }
        }
    }
    
    /**
     * @dev Gets detailed portfolio information
     */
    function getPortfolioInfo(address user) external view returns (
        address[] memory tokens,
        uint256[] memory targetWeights,
        uint256[] memory currentAmounts,
        uint256[] memory currentWeights,
        uint256 totalValueUSD,
        bool needsRebalance
    ) {
        Portfolio memory portfolio = portfolios[user];
        
        (totalValueUSD, currentWeights) = calculateCurrentWeights(user);
        (needsRebalance, , , ) = checkRebalanceNeeded(user);
        
        return (
            portfolio.tokens,
            portfolio.targetWeights,
            portfolio.currentAmounts,
            currentWeights,
            totalValueUSD,
            needsRebalance
        );
    }
    
    /**
     * @dev Gets list of users with active portfolios
     */
    function getActiveUsers() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Counts active users
        for (uint256 i = 0; i < activeUsers.length; i++) {
            if (portfolios[activeUsers[i]].isActive) {
                activeCount++;
            }
        }
        
        // Creates array with active users
        address[] memory active = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < activeUsers.length; i++) {
            if (portfolios[activeUsers[i]].isActive) {
                active[index] = activeUsers[i];
                index++;
            }
        }
        
        return active;
    }
    
    /**
     * @dev Updates fee settings
     */
    function updateFees(uint256 newRebalanceFee) external onlyOwner {
        rebalanceFee = newRebalanceFee;
    }
    
    /**
     * @dev Withdraws collected fees
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}