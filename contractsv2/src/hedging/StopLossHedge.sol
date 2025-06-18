// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StopLossHedge
 * @dev Specific contract for automatic stop loss execution
 * @notice Allows users to configure automatic stop loss for their assets
 */
contract StopLossHedge is ReentrancyGuard, Ownable {
    
    struct StopLossOrder {
        address user;           // User who created the order
        address token;          // Token to be protected
        uint256 amount;         // Token amount
        uint256 stopPrice;      // Stop loss price
        uint256 slippage;       // Tolerated slippage (in basis points)
        bool isActive;          // Order status
        uint256 createdAt;      // Creation timestamp
        uint256 expiresAt;      // Expiration timestamp
    }
    
    struct TokenConfig {
        AggregatorV3Interface priceFeed;  // Chainlink price feed
        bool isSupported;                 // If the token is supported
        uint256 minAmount;                // Minimum amount for hedge
    }
    
    // Mappings
    mapping(address => mapping(uint256 => StopLossOrder)) public stopLossOrders;
    mapping(address => uint256) public userOrderCount;
    mapping(address => TokenConfig) public tokenConfigs;
    
    // Arrays for iteration
    address[] public supportedTokens;
    
    // Configurations
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public maxSlippage = 500; // 5% maximum
    uint256 public executionFee = 0.001 ether; // Execution fee
    
    // Events
    event StopLossCreated(
        address indexed user,
        uint256 indexed orderId,
        address indexed token,
        uint256 amount,
        uint256 stopPrice
    );
    
    event StopLossExecuted(
        address indexed user,
        uint256 indexed orderId,
        address indexed token,
        uint256 amount,
        uint256 executionPrice
    );
    
    event StopLossCancelled(
        address indexed user,
        uint256 indexed orderId
    );
    
    event TokenConfigured(
        address indexed token,
        address indexed priceFeed,
        uint256 minAmount
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Configures a token to be used in the system
     */
    function configureToken(
        address token,
        address priceFeed,
        uint256 minAmount
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(priceFeed != address(0), "Invalid price feed address");
        
        if (!tokenConfigs[token].isSupported) {
            supportedTokens.push(token);
        }
        
        tokenConfigs[token] = TokenConfig({
            priceFeed: AggregatorV3Interface(priceFeed),
            isSupported: true,
            minAmount: minAmount
        });
        
        emit TokenConfigured(token, priceFeed, minAmount);
    }
    
    /**
     * @dev Creates a stop loss order
     */
    function createStopLoss(
        address token,
        uint256 amount,
        uint256 stopPrice,
        uint256 slippage,
        uint256 expirationTime
    ) external payable nonReentrant {
        require(msg.value >= executionFee, "Insufficient execution fee");
        require(tokenConfigs[token].isSupported, "Token not supported");
        require(amount >= tokenConfigs[token].minAmount, "Amount below minimum");
        require(slippage <= maxSlippage, "Slippage too high");
        require(expirationTime > block.timestamp, "Invalid expiration time");
        
        // Checks if the user has the tokens
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(msg.sender) >= amount, "Insufficient token balance");
        
        // Transfers tokens to the contract
        require(
            tokenContract.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        
        uint256 orderId = userOrderCount[msg.sender];
        userOrderCount[msg.sender]++;
        
        stopLossOrders[msg.sender][orderId] = StopLossOrder({
            user: msg.sender,
            token: token,
            amount: amount,
            stopPrice: stopPrice,
            slippage: slippage,
            isActive: true,
            createdAt: block.timestamp,
            expiresAt: expirationTime
        });
        
        emit StopLossCreated(msg.sender, orderId, token, amount, stopPrice);
    }
    
    /**
     * @dev Executes a stop loss order (called by automation)
     */
    function executeStopLoss(
        address user,
        uint256 orderId
    ) external nonReentrant {
        StopLossOrder storage order = stopLossOrders[user][orderId];
        require(order.isActive, "Order not active");
        require(block.timestamp <= order.expiresAt, "Order expired");
        
        // Checks the current price
        uint256 currentPrice = getCurrentPrice(order.token);
        require(currentPrice <= order.stopPrice, "Stop price not reached");
        
        // Calculates the minimum acceptable price with slippage
        uint256 minPrice = (order.stopPrice * (BASIS_POINTS - order.slippage)) / BASIS_POINTS;
        require(currentPrice >= minPrice, "Price below slippage tolerance");
        
        // Deactivates the order
        order.isActive = false;
        
        // Here the real selling logic would be implemented
        // For simplicity, we'll just return the tokens to the user
        IERC20(order.token).transfer(order.user, order.amount);
        
        emit StopLossExecuted(user, orderId, order.token, order.amount, currentPrice);
    }
    
    /**
     * @dev Cancels a stop loss order
     */
    function cancelStopLoss(uint256 orderId) external nonReentrant {
        StopLossOrder storage order = stopLossOrders[msg.sender][orderId];
        require(order.isActive, "Order not active");
        require(order.user == msg.sender, "Not order owner");
        
        order.isActive = false;
        
        // Returns the tokens
        IERC20(order.token).transfer(msg.sender, order.amount);
        
        emit StopLossCancelled(msg.sender, orderId);
    }
    
    /**
     * @dev Gets the current price of a token
     */
    function getCurrentPrice(address token) public view returns (uint256) {
        require(tokenConfigs[token].isSupported, "Token not supported");
        
        AggregatorV3Interface priceFeed = tokenConfigs[token].priceFeed;
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from feed");
        
        return uint256(price);
    }
    
    /**
     * @dev Checks if an order needs to be executed
     */
    function checkStopLossExecution(
        address user,
        uint256 orderId
    ) external view returns (bool needsExecution, uint256 currentPrice) {
        StopLossOrder memory order = stopLossOrders[user][orderId];
        
        if (!order.isActive || block.timestamp > order.expiresAt) {
            return (false, 0);
        }
        
        currentPrice = getCurrentPrice(order.token);
        needsExecution = currentPrice <= order.stopPrice;
        
        return (needsExecution, currentPrice);
    }
    
    /**
     * @dev Gets all active orders of a user
     */
    function getUserActiveOrders(address user) external view returns (StopLossOrder[] memory) {
        uint256 totalOrders = userOrderCount[user];
        uint256 activeCount = 0;
        
        // Counts active orders
        for (uint256 i = 0; i < totalOrders; i++) {
            if (stopLossOrders[user][i].isActive) {
                activeCount++;
            }
        }
        
        // Creates array with active orders
        StopLossOrder[] memory activeOrders = new StopLossOrder[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < totalOrders; i++) {
            if (stopLossOrders[user][i].isActive) {
                activeOrders[index] = stopLossOrders[user][i];
                index++;
            }
        }
        
        return activeOrders;
    }
    
    /**
     * @dev Updates the execution fee
     */
    function updateExecutionFee(uint256 newFee) external onlyOwner {
        executionFee = newFee;
    }
    
    /**
     * @dev Withdraws collected fees
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}