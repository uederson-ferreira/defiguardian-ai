// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/hedging/StopLossHedge.sol

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../config/Addresses.sol";
// Definição da interface ISwapRouter diretamente no arquivo

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

/**
 * @title StopLossHedge
 * @dev Specific contract for automatic stop loss execution
 * @notice Allows users to configure automatic stop loss for their assets
 */
contract StopLossHedge is ReentrancyGuard, Ownable {
    
    // ✅ CORREÇÃO: Remover dependências problemáticas e usar endereços hardcoded para demo
    ISwapRouter public immutable uniswapRouter;
    address public immutable weth;

    constructor() Ownable(msg.sender) {
        // Inicialização de variáveis imutáveis sem condicionais
        // Determinando os endereços corretos com base na chain ID
        address routerAddress;
        address wethAddress;
        
        if (block.chainid == 11155111) {
            // Sepolia
            routerAddress = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;
            wethAddress = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
        } else if (block.chainid == 1) {
            // Mainnet
            routerAddress = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
            wethAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        } else {
            // Local/outras redes - usar placeholders
            routerAddress = address(0);
            wethAddress = address(0);
        }
        
        // Inicialização das variáveis imutáveis fora dos blocos condicionais
        uniswapRouter = ISwapRouter(routerAddress);
        weth = wethAddress;
    }
    
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
    
    event StopLossFailed(
        address indexed user,
        uint256 indexed orderId,
        string reason
    );
    
    event TokenConfigured(
        address indexed token,
        address indexed priceFeed,
        uint256 minAmount
    );
    
    /**
     * @dev ✅ CORREÇÃO: Configura token com validações robustas
     */
    function configureToken(
        address token,
        address priceFeed,
        uint256 minAmount
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(priceFeed != address(0), "Invalid price feed address");
        require(priceFeed.code.length > 0, "Price feed must be contract");
        
        // ✅ VALIDAÇÃO: Testar se é price feed válido
        try AggregatorV3Interface(priceFeed).latestRoundData() returns (
            uint80, int256 price, uint256, uint256, uint80
        ) {
            require(price > 0, "Price feed returning invalid data");
        } catch {
            revert("Invalid Chainlink price feed");
        }
        
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
     * @dev ✅ CORREÇÃO: Creates stop loss order com validações
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
        require(expirationTime <= block.timestamp + 365 days, "Expiration too far"); // ✅ NOVO
        
        // ✅ VALIDAÇÃO: Verificar preço atual vs stop price
        uint256 currentPrice = getCurrentPrice(token);
        require(stopPrice < currentPrice, "Stop price must be below current price");
        
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
     * @dev ✅ CORREÇÃO: Executes stop loss order com tratamento de erros
     */
    function executeStopLoss(address user, uint256 orderId) external nonReentrant {
        StopLossOrder storage order = stopLossOrders[user][orderId];
        require(order.isActive, "Order not active");
        require(block.timestamp <= order.expiresAt, "Order expired");
        
        // ✅ VALIDAÇÃO: Verificar se execução é necessária
        (bool needsExecution, uint256 currentPrice) = checkStopLossExecution(user, orderId);
        require(needsExecution, "Stop loss conditions not met");
        
        order.isActive = false;
        
        // ✅ CORREÇÃO: Tratamento robusto de swap com fallback
        if (address(uniswapRouter) != address(0) && weth != address(0)) {
            // Try to execute swap via Uniswap
            try this._executeSwap(order, currentPrice) {
                emit StopLossExecuted(user, orderId, order.token, order.amount, currentPrice);
            } catch Error(string memory reason) {
                // ✅ FALLBACK: Se swap falhar, devolver tokens
                IERC20(order.token).transfer(order.user, order.amount);
                emit StopLossFailed(user, orderId, reason);
            }
        } else {
            // ✅ FALLBACK: Em redes sem Uniswap, apenas devolver tokens
            IERC20(order.token).transfer(order.user, order.amount);
            emit StopLossExecuted(user, orderId, order.token, order.amount, currentPrice);
        }
    }
    
    /**
     * @dev ✅ NOVA FUNÇÃO: Swap externo para tratamento de erros
     */
    function _executeSwap(StopLossOrder memory order, uint256 currentPrice) external {
        require(msg.sender == address(this), "Only self");
        
        // Calculate minimum output com slippage
        uint256 expectedOutput = (order.amount * currentPrice) / (10 ** 18); // Assuming 18 decimals
        uint256 minAmountOut = expectedOutput * (BASIS_POINTS - order.slippage) / BASIS_POINTS;
        
        // Approve token for swap
        IERC20(order.token).approve(address(uniswapRouter), order.amount);
        
        // Execute swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: order.token,
            tokenOut: weth,
            fee: 3000, // 0.3% fee tier
            recipient: order.user,
            deadline: block.timestamp + 300, // 5 minutes
            amountIn: order.amount,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });
        
        uniswapRouter.exactInputSingle(params);
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
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from feed");
        require(block.timestamp - updatedAt <= 3600, "Price data too old"); // ✅ NOVO: Max 1h old
        
        return uint256(price);
    }
    
    /**
     * @dev Checks if an order needs to be executed
     */
    function checkStopLossExecution(
        address user,
        uint256 orderId
    ) public view returns (bool needsExecution, uint256 currentPrice) {
        StopLossOrder memory order = stopLossOrders[user][orderId];
        
        if (!order.isActive || block.timestamp > order.expiresAt) {
            return (false, 0);
        }
        
        try this.getCurrentPrice(order.token) returns (uint256 price) {
            currentPrice = price;
            needsExecution = currentPrice <= order.stopPrice;
        } catch {
            // Se não conseguir obter preço, não executar
            return (false, 0);
        }
        
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
            if (stopLossOrders[user][i].isActive && 
                block.timestamp <= stopLossOrders[user][i].expiresAt) {
                activeCount++;
            }
        }
        
        // Creates array with active orders
        StopLossOrder[] memory activeOrders = new StopLossOrder[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < totalOrders; i++) {
            if (stopLossOrders[user][i].isActive && 
                block.timestamp <= stopLossOrders[user][i].expiresAt) {
                activeOrders[index] = stopLossOrders[user][i];
                index++;
            }
        }
        
        return activeOrders;
    }
    
    /**
     * @dev ✅ NOVA FUNÇÃO: Get active orders count (para RiskGuardianMaster)
     */
    function getUserActiveOrdersCount(address user) external view returns (uint256) {
        uint256 totalOrders = userOrderCount[user];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < totalOrders; i++) {
            if (stopLossOrders[user][i].isActive && 
                block.timestamp <= stopLossOrders[user][i].expiresAt) {
                activeCount++;
            }
        }
        
        return activeCount;
    }
    
    /**
     * @dev Updates the execution fee
     */
    function updateExecutionFee(uint256 newFee) external onlyOwner {
        require(newFee <= 0.01 ether, "Fee too high"); // ✅ NOVO: limite máximo
        executionFee = newFee;
    }
    
    /**
     * @dev Withdraws collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Emergency function to recover stuck tokens
     */
    function emergencyRecoverToken(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        IERC20(token).transfer(owner(), amount);
    }
}