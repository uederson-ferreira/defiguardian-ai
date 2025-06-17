// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StopLossHedge
 * @dev Contrato específico para execução automática de stop loss
 * @notice Permite aos usuários configurar stop loss automático para seus ativos
 */
contract StopLossHedge is ReentrancyGuard, Ownable {
    
    struct StopLossOrder {
        address user;           // Usuário que criou a ordem
        address token;          // Token a ser protegido
        uint256 amount;         // Quantidade do token
        uint256 stopPrice;      // Preço de stop loss
        uint256 slippage;       // Slippage tolerado (em basis points)
        bool isActive;          // Status da ordem
        uint256 createdAt;      // Timestamp de criação
        uint256 expiresAt;      // Timestamp de expiração
    }
    
    struct TokenConfig {
        AggregatorV3Interface priceFeed;  // Price feed do Chainlink
        bool isSupported;                 // Se o token é suportado
        uint256 minAmount;                // Quantidade mínima para hedge
    }
    
    // Mapeamentos
    mapping(address => mapping(uint256 => StopLossOrder)) public stopLossOrders;
    mapping(address => uint256) public userOrderCount;
    mapping(address => TokenConfig) public tokenConfigs;
    
    // Arrays para iteração
    address[] public supportedTokens;
    
    // Configurações
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public maxSlippage = 500; // 5% máximo
    uint256 public executionFee = 0.001 ether; // Taxa de execução
    
    // Eventos
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
    
    constructor() {}
    
    /**
     * @dev Configura um token para ser usado no sistema
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
     * @dev Cria uma ordem de stop loss
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
        
        // Verifica se o usuário tem os tokens
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(msg.sender) >= amount, "Insufficient token balance");
        
        // Transfere os tokens para o contrato
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
     * @dev Executa uma ordem de stop loss (chamada pela automação)
     */
    function executeStopLoss(
        address user,
        uint256 orderId
    ) external nonReentrant {
        StopLossOrder storage order = stopLossOrders[user][orderId];
        require(order.isActive, "Order not active");
        require(block.timestamp <= order.expiresAt, "Order expired");
        
        // Verifica o preço atual
        uint256 currentPrice = getCurrentPrice(order.token);
        require(currentPrice <= order.stopPrice, "Stop price not reached");
        
        // Calcula o preço mínimo aceitável com slippage
        uint256 minPrice = (order.stopPrice * (BASIS_POINTS - order.slippage)) / BASIS_POINTS;
        require(currentPrice >= minPrice, "Price below slippage tolerance");
        
        // Desativa a ordem
        order.isActive = false;
        
        // Aqui seria implementada a lógica de venda real
        // Por simplicidade, vamos apenas devolver os tokens ao usuário
        IERC20(order.token).transfer(order.user, order.amount);
        
        emit StopLossExecuted(user, orderId, order.token, order.amount, currentPrice);
    }
    
    /**
     * @dev Cancela uma ordem de stop loss
     */
    function cancelStopLoss(uint256 orderId) external nonReentrant {
        StopLossOrder storage order = stopLossOrders[msg.sender][orderId];
        require(order.isActive, "Order not active");
        require(order.user == msg.sender, "Not order owner");
        
        order.isActive = false;
        
        // Devolve os tokens
        IERC20(order.token).transfer(msg.sender, order.amount);
        
        emit StopLossCancelled(msg.sender, orderId);
    }
    
    /**
     * @dev Obtém o preço atual de um token
     */
    function getCurrentPrice(address token) public view returns (uint256) {
        require(tokenConfigs[token].isSupported, "Token not supported");
        
        AggregatorV3Interface priceFeed = tokenConfigs[token].priceFeed;
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from feed");
        
        return uint256(price);
    }
    
    /**
     * @dev Verifica se uma ordem precisa ser executada
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
     * @dev Obtém todas as ordens ativas de um usuário
     */
    function getUserActiveOrders(address user) external view returns (StopLossOrder[] memory) {
        uint256 totalOrders = userOrderCount[user];
        uint256 activeCount = 0;
        
        // Conta ordens ativas
        for (uint256 i = 0; i < totalOrders; i++) {
            if (stopLossOrders[user][i].isActive) {
                activeCount++;
            }
        }
        
        // Cria array com ordens ativas
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
     * @dev Atualiza a taxa de execução
     */
    function updateExecutionFee(uint256 newFee) external onlyOwner {
        executionFee = newFee;
    }
    
    /**
     * @dev Saca as taxas coletadas
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
} 