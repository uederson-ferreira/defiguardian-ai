// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/hedging/VolatilityHedge.sol

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VolatilityHedge
 * @dev Contrato específico para hedge contra volatilidade excessiva
 * @notice Protege posições quando a volatilidade ultrapassa thresholds definidos
 */
contract VolatilityHedge is ReentrancyGuard, Ownable {
    
    struct VolatilityPosition {
        address user;               // Usuário proprietário
        address token;              // Token sendo protegido
        uint256 amount;             // Quantidade protegida
        uint256 volatilityThreshold; // Threshold de volatilidade (em basis points)
        uint256 maxLoss;            // Perda máxima tolerada (em basis points)
        uint256 timeWindow;         // Janela de tempo para cálculo de volatilidade
        uint256 lastPriceUpdate;    // Último update de preço
        uint256[] priceHistory;     // Histórico de preços
        bool isActive;              // Status da posição
        uint256 createdAt;          // Timestamp de criação
        HedgeAction hedgeAction;    // Ação a ser tomada em alta volatilidade
    }
    
    enum HedgeAction {
        SELL_PERCENTAGE,    // Vender uma porcentagem
        CONVERT_TO_STABLE,  // Converter para stablecoin
        PAUSE_TRADING       // Pausar trading automaticamente
    }
    
    struct TokenConfig {
        AggregatorV3Interface priceFeed;
        address stableToken;        // Token estável para conversão
        uint8 decimals;
        bool isSupported;
        uint256 maxVolatilityHistory; // Máximo de pontos no histórico
    }
    
    // Mapeamentos
    mapping(address => mapping(uint256 => VolatilityPosition)) public volatilityPositions;
    mapping(address => uint256) public userPositionCount;
    mapping(address => TokenConfig) public tokenConfigs;
    
    // Arrays para tracking
    address[] public activeUsers;
    address[] public supportedTokens;
    
    // Configurações
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_VOLATILITY_THRESHOLD = 5000; // 50% max
    uint256 public constant MIN_TIME_WINDOW = 5 minutes;
    uint256 public constant MAX_TIME_WINDOW = 24 hours;
    uint256 public volatilityFee = 0.003 ether;
    
    // Eventos
    event VolatilityPositionCreated(
        address indexed user,
        uint256 indexed positionId,
        address indexed token,
        uint256 amount,
        uint256 volatilityThreshold
    );
    
    event HighVolatilityDetected(
        address indexed user,
        uint256 indexed positionId,
        address indexed token,
        uint256 calculatedVolatility,
        uint256 threshold
    );
    
    event VolatilityHedgeExecuted(
        address indexed user,
        uint256 indexed positionId,
        address indexed token,
        uint256 amount,
        HedgeAction action
    );
    
    event PriceUpdated(
        address indexed token,
        uint256 price,
        uint256 timestamp
    );
    
    // ✅ CONSTRUTOR CORRIGIDO
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Configura um token para proteção de volatilidade
     */
    function configureToken(
        address token,
        address priceFeed,
        address stableToken,
        uint8 decimals,
        uint256 maxVolatilityHistory
    ) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(priceFeed != address(0), "Invalid price feed");
        require(stableToken != address(0), "Invalid stable token");
        require(maxVolatilityHistory >= 10, "History too small");
        
        if (!tokenConfigs[token].isSupported) {
            supportedTokens.push(token);
        }
        
        tokenConfigs[token] = TokenConfig({
            priceFeed: AggregatorV3Interface(priceFeed),
            stableToken: stableToken,
            decimals: decimals,
            isSupported: true,
            maxVolatilityHistory: maxVolatilityHistory
        });
    }
    
    /**
     * @dev Cria uma posição de hedge de volatilidade
     */
    function createVolatilityPosition(
        address token,
        uint256 amount,
        uint256 volatilityThreshold,
        uint256 maxLoss,
        uint256 timeWindow,
        HedgeAction hedgeAction
    ) external payable nonReentrant {
        require(msg.value >= volatilityFee, "Insufficient fee");
        require(tokenConfigs[token].isSupported, "Token not supported");
        require(amount > 0, "Invalid amount");
        require(volatilityThreshold <= MAX_VOLATILITY_THRESHOLD, "Threshold too high");
        require(maxLoss <= 5000, "Max loss too high"); // 50% max
        require(timeWindow >= MIN_TIME_WINDOW && timeWindow <= MAX_TIME_WINDOW, "Invalid time window");
        
        // Transfere tokens para o contrato
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        uint256 positionId = userPositionCount[msg.sender];
        userPositionCount[msg.sender]++;
        
        // Inicializa histórico de preços
        uint256 currentPrice = getCurrentPrice(token);
        uint256[] memory initialHistory = new uint256[](1);
        initialHistory[0] = currentPrice;
        
        volatilityPositions[msg.sender][positionId] = VolatilityPosition({
            user: msg.sender,
            token: token,
            amount: amount,
            volatilityThreshold: volatilityThreshold,
            maxLoss: maxLoss,
            timeWindow: timeWindow,
            lastPriceUpdate: block.timestamp,
            priceHistory: initialHistory,
            isActive: true,
            createdAt: block.timestamp,
            hedgeAction: hedgeAction
        });
        
        activeUsers.push(msg.sender);
        
        emit VolatilityPositionCreated(
            msg.sender,
            positionId,
            token,
            amount,
            volatilityThreshold
        );
    }
    
    /**
     * @dev Atualiza o preço e verifica volatilidade
     */
    function updatePriceAndCheckVolatility(
        address user,
        uint256 positionId
    ) external returns (bool needsHedge, uint256 volatility) {
        VolatilityPosition storage position = volatilityPositions[user][positionId];
        require(position.isActive, "Position not active");
        
        uint256 currentPrice = getCurrentPrice(position.token);
        
        // Adiciona novo preço ao histórico
        position.priceHistory.push(currentPrice);
        position.lastPriceUpdate = block.timestamp;
        
        // Remove preços antigos se necessário
        TokenConfig memory config = tokenConfigs[position.token];
        if (position.priceHistory.length > config.maxVolatilityHistory) {
            // Remove primeiro elemento (mais antigo)
            for (uint256 i = 0; i < position.priceHistory.length - 1; i++) {
                position.priceHistory[i] = position.priceHistory[i + 1];
            }
            position.priceHistory.pop();
        }
        
        // Calcula volatilidade
        volatility = calculateVolatility(position.priceHistory);
        needsHedge = volatility >= position.volatilityThreshold;
        
        if (needsHedge) {
            emit HighVolatilityDetected(
                user,
                positionId,
                position.token,
                volatility,
                position.volatilityThreshold
            );
        }
        
        emit PriceUpdated(position.token, currentPrice, block.timestamp);
        
        return (needsHedge, volatility);
    }
    
    /**
     * @dev Executa hedge de volatilidade
     */
    function executeVolatilityHedge(
        address user,
        uint256 positionId
    ) external nonReentrant {
        VolatilityPosition storage position = volatilityPositions[user][positionId];
        require(position.isActive, "Position not active");
        
        // Atualiza preço e verifica volatilidade
        uint256 currentPrice = getCurrentPrice(position.token);
        
        // Adiciona novo preço ao histórico
        position.priceHistory.push(currentPrice);
        position.lastPriceUpdate = block.timestamp;
        
        // Calcula volatilidade
        uint256 volatility = calculateVolatility(position.priceHistory);
        bool needsHedge = volatility >= position.volatilityThreshold;
        require(needsHedge, "Hedge not needed");
        
        uint256 hedgeAmount = position.amount;
        
        if (position.hedgeAction == HedgeAction.SELL_PERCENTAGE) {
            // Vende porcentagem baseada na volatilidade
            uint256 sellPercentage = _calculateSellPercentage(volatility, position.volatilityThreshold);
            hedgeAmount = (position.amount * sellPercentage) / BASIS_POINTS;
            
            // Por simplicidade, apenas reduz a posição
            position.amount -= hedgeAmount;
            IERC20(position.token).transfer(user, hedgeAmount);
            
        } else if (position.hedgeAction == HedgeAction.CONVERT_TO_STABLE) {
            // Converte para stablecoin (simulado)
            // uint256 stableAmount = _simulateConversion(position.token, stableToken, hedgeAmount);
            
            position.amount = 0;
            position.isActive = false;
            
            // Por simplicidade, transfere tokens originais de volta
            IERC20(position.token).transfer(user, hedgeAmount);
            
        } else if (position.hedgeAction == HedgeAction.PAUSE_TRADING) {
            // Pausa a posição temporariamente
            position.isActive = false;
            IERC20(position.token).transfer(user, position.amount);
        }
        
        emit VolatilityHedgeExecuted(
            user,
            positionId,
            position.token,
            hedgeAmount,
            position.hedgeAction
        );
    }
    
    /**
     * @dev Calcula a volatilidade baseada no histórico de preços
     */
    function calculateVolatility(uint256[] memory prices) public pure returns (uint256) {
        if (prices.length < 2) return 0;
        
        // Calcula média
        uint256 sum = 0;
        for (uint256 i = 0; i < prices.length; i++) {
            sum += prices[i];
        }
        uint256 mean = sum / prices.length;
        
        // Calcula desvio padrão
        uint256 varianceSum = 0;
        for (uint256 i = 0; i < prices.length; i++) {
            uint256 diff = prices[i] > mean ? prices[i] - mean : mean - prices[i];
            varianceSum += (diff * diff);
        }
        
        uint256 variance = varianceSum / prices.length;
        uint256 volatility = _sqrt(variance);
        
        // Retorna volatilidade como porcentagem da média
        return (volatility * BASIS_POINTS) / mean;
    }
    
    /**
     * @dev Obtém o preço atual de um token
     */
    function getCurrentPrice(address token) public view returns (uint256) {
        require(tokenConfigs[token].isSupported, "Token not supported");
        
        AggregatorV3Interface priceFeed = tokenConfigs[token].priceFeed;
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        
        return uint256(price);
    }
    
    /**
     * @dev Verifica todas as posições que precisam de verificação de volatilidade
     */
    function checkAllPositionsForVolatility() external view returns (
        address[] memory users,
        uint256[] memory positionIds,
        bool[] memory needsHedge
    ) {
        uint256 totalChecks = 0;
        
        // Conta quantas verificações são necessárias
        for (uint256 i = 0; i < activeUsers.length; i++) {
            address user = activeUsers[i];
            uint256 userPositions = userPositionCount[user];
            
            for (uint256 j = 0; j < userPositions; j++) {
                VolatilityPosition memory position = volatilityPositions[user][j];
                if (position.isActive && 
                    block.timestamp >= position.lastPriceUpdate + 300) { // 5 min interval
                    totalChecks++;
                }
            }
        }
        
        // Cria arrays de retorno
        users = new address[](totalChecks);
        positionIds = new uint256[](totalChecks);
        needsHedge = new bool[](totalChecks);
        
        uint256 index = 0;
        
        // Preenche arrays
        for (uint256 i = 0; i < activeUsers.length; i++) {
            address user = activeUsers[i];
            uint256 userPositions = userPositionCount[user];
            
            for (uint256 j = 0; j < userPositions; j++) {
                VolatilityPosition memory position = volatilityPositions[user][j];
                if (position.isActive && 
                    block.timestamp >= position.lastPriceUpdate + 300) {
                    
                    users[index] = user;
                    positionIds[index] = j;
                    
                    // Simula verificação de volatilidade
                    uint256 volatility = calculateVolatility(position.priceHistory);
                    needsHedge[index] = volatility >= position.volatilityThreshold;
                    
                    index++;
                }
            }
        }
        
        return (users, positionIds, needsHedge);
    }
    
    /**
     * @dev Calcula porcentagem de venda baseada na volatilidade
     */
    function _calculateSellPercentage(
        uint256 volatility,
        uint256 threshold
    ) internal pure returns (uint256) {
        // Vende mais conforme a volatilidade aumenta
        uint256 excessVolatility = volatility - threshold;
        uint256 sellPercentage = (excessVolatility * 3000) / BASIS_POINTS; // Max 30%
        
        if (sellPercentage > 3000) sellPercentage = 3000; // Cap at 30%
        
        return sellPercentage;
    }
    
    /**
     * @dev Simula conversão entre tokens
     */
    function _simulateConversion(
        address fromToken,
        address toToken,
        uint256 amount
    ) internal view returns (uint256) {
        uint256 fromPrice = getCurrentPrice(fromToken);
        uint256 toPrice = getCurrentPrice(toToken);
        
        return (amount * fromPrice) / toPrice;
    }
    
    /**
     * @dev Calcula raiz quadrada (aproximação)
     */
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        
        return y;
    }
    
    /**
     * @dev Permite cancelar uma posição
     */
    function cancelVolatilityPosition(uint256 positionId) external nonReentrant {
        VolatilityPosition storage position = volatilityPositions[msg.sender][positionId];
        require(position.isActive, "Position not active");
        require(position.user == msg.sender, "Not position owner");
        
        position.isActive = false;
        IERC20(position.token).transfer(msg.sender, position.amount);
    }
    
    /**
     * @dev Obtém informações de uma posição
     */
    function getPositionInfo(
        address user,
        uint256 positionId
    ) external view returns (
        VolatilityPosition memory position,
        uint256 currentVolatility,
        bool needsHedge
    ) {
        position = volatilityPositions[user][positionId];
        currentVolatility = calculateVolatility(position.priceHistory);
        needsHedge = currentVolatility >= position.volatilityThreshold;
        
        return (position, currentVolatility, needsHedge);
    }
    
    /**
     * @dev Atualiza configurações
     */
    function updateVolatilityFee(uint256 newFee) external onlyOwner {
        volatilityFee = newFee;
    }
    
    /**
     * @dev Saca taxas coletadas
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}