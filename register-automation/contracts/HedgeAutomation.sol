// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract HedgeAutomation is AutomationCompatible {
    address private _owner;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    struct HedgeStrategy {
        address token;           // Token a ser protegido
        uint256 amount;         // Quantidade do token
        uint256 targetPrice;    // Preco alvo para execucao
        uint256 threshold;      // Threshold de variacao (em %)
        bool isActive;          // Status da estrategia
        HedgeType hedgeType;    // Tipo de hedge
    }

    enum HedgeType {
        STOP_LOSS,
        TAKE_PROFIT,
        REBALANCE
    }

    // Mapeamento de estrategias por usuario
    mapping(address => HedgeStrategy[]) public userStrategies;
    
    // Price feeds do Chainlink
    mapping(address => address) public priceFeeds;
    
    // Eventos
    event StrategyCreated(address indexed user, uint256 strategyId, HedgeType hedgeType);
    event StrategyExecuted(address indexed user, uint256 strategyId, uint256 price);
    event StrategyUpdated(address indexed user, uint256 strategyId);
    event RebalanceTriggered(address indexed user, uint256 amount, uint256 price);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event UpkeepPerformed(address indexed user, uint256 strategyId, uint256 price);
    event UpkeepChecked(bool needed, bytes performData);

    constructor() {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
        
        // Inicializa price feeds para tokens principais na Sepolia
        priceFeeds[address(0)] = 0x694AA1769357215DE4FAC081bf1f309aDC325306; // ETH/USD
        priceFeeds[0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2] = 0x694AA1769357215DE4FAC081bf1f309aDC325306; // WETH/USD
        priceFeeds[0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599] = 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43; // WBTC/USD
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function createStrategy(
        address token,
        uint256 amount,
        uint256 targetPrice,
        uint256 threshold,
        HedgeType hedgeType
    ) external {
        require(token != address(0), "Token invalido");
        require(amount > 0, "Quantidade deve ser maior que zero");
        require(targetPrice > 0, "Preco alvo deve ser maior que zero");
        require(threshold > 0 && threshold <= 100, "Threshold invalido");
        require(priceFeeds[token] != address(0), "Price feed nao configurado");

        HedgeStrategy memory strategy = HedgeStrategy({
            token: token,
            amount: amount,
            targetPrice: targetPrice,
            threshold: threshold,
            isActive: true,
            hedgeType: hedgeType
        });

        userStrategies[msg.sender].push(strategy);
        emit StrategyCreated(msg.sender, userStrategies[msg.sender].length - 1, hedgeType);
    }

    function updateStrategy(
        uint256 strategyId,
        uint256 newTargetPrice,
        uint256 newThreshold
    ) external {
        require(strategyId < userStrategies[msg.sender].length, "Estrategia nao encontrada");
        require(newTargetPrice > 0, "Preco alvo deve ser maior que zero");
        require(newThreshold > 0 && newThreshold <= 100, "Threshold invalido");

        HedgeStrategy storage strategy = userStrategies[msg.sender][strategyId];
        strategy.targetPrice = newTargetPrice;
        strategy.threshold = newThreshold;

        emit StrategyUpdated(msg.sender, strategyId);
    }

    function deactivateStrategy(uint256 strategyId) external {
        require(strategyId < userStrategies[msg.sender].length, "Estrategia nao encontrada");
        userStrategies[msg.sender][strategyId].isActive = false;
        emit StrategyUpdated(msg.sender, strategyId);
    }

    function getAllUsers() public view returns (address[] memory) {
        // Implementacao simplificada - em producao usar um array dinamico
        address[] memory users = new address[](1);
        users[0] = msg.sender;
        return users;
    }

    function checkStrategy(HedgeStrategy memory strategy) internal view returns (bool, uint256) {
        // Simulacao de preco - em producao usar Chainlink Price Feeds
        uint256 currentPrice = 1500 * 10**8; // $1500.00 USD
        
        if (strategy.hedgeType == HedgeType.STOP_LOSS) {
            return (currentPrice <= strategy.targetPrice, currentPrice);
        } else if (strategy.hedgeType == HedgeType.TAKE_PROFIT) {
            return (currentPrice >= strategy.targetPrice, currentPrice);
        } else { // REBALANCE
            uint256 deviation = calculateDeviation(currentPrice, strategy.targetPrice);
            return (deviation >= strategy.threshold, currentPrice);
        }
    }

    function calculateDeviation(uint256 currentPrice, uint256 targetPrice) internal pure returns (uint256) {
        if (currentPrice > targetPrice) {
            return ((currentPrice - targetPrice) * 100) / targetPrice;
        } else {
            return ((targetPrice - currentPrice) * 100) / targetPrice;
        }
    }

    function executeHedge(address user, uint256 strategyId, uint256 currentPrice) internal {
        HedgeStrategy storage strategy = userStrategies[user][strategyId];
        
        // Aqui seria implementada a logica de hedge
        // Por exemplo, vender tokens em caso de stop loss
        // ou comprar em caso de take profit
        
        strategy.isActive = false; // Desativa apos execucao
        emit StrategyExecuted(user, strategyId, currentPrice);
    }

    function executeRebalance(address user, uint256 strategyId, uint256 currentPrice) internal {
        HedgeStrategy storage strategy = userStrategies[user][strategyId];
        
        // Aqui seria implementada a logica de rebalanceamento
        // Por exemplo, ajustar as posicoes para manter o ratio desejado
        
        emit RebalanceTriggered(user, strategy.amount, currentPrice);
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        address[] memory users = getAllUsers();
        for (uint i = 0; i < users.length; i++) {
            HedgeStrategy[] storage strategies = userStrategies[users[i]];
            
            for (uint256 j = 0; j < strategies.length; j++) {
                if (!strategies[j].isActive) continue;

                (bool needsExecution, uint256 currentPrice) = checkStrategy(strategies[j]);
                
                if (needsExecution) {
                    return (true, abi.encode(users[i], j, currentPrice));
                }
            }
        }

        return (false, bytes(""));
    }

    function performUpkeep(bytes calldata performData) external override {
        (address user, uint256 strategyId, uint256 currentPrice) = abi.decode(performData, (address, uint256, uint256));
        
        HedgeStrategy storage strategy = userStrategies[user][strategyId];
        require(strategy.isActive, "Estrategia inativa");

        if (strategy.hedgeType == HedgeType.REBALANCE) {
            executeRebalance(user, strategyId, currentPrice);
        } else {
            executeHedge(user, strategyId, currentPrice);
        }

        emit UpkeepPerformed(user, strategyId, currentPrice);
    }
}