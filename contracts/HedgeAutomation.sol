// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

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
        uint256 targetPrice;    // Preço alvo para execução
        uint256 threshold;      // Threshold de variação (em %)
        bool isActive;          // Status da estratégia
        HedgeType hedgeType;    // Tipo de hedge
    }

    enum HedgeType {
        STOP_LOSS,
        TAKE_PROFIT,
        REBALANCE
    }

    // Mapeamento de estratégias por usuário
    mapping(address => HedgeStrategy[]) public userStrategies;
    
    // Preço feeds do Chainlink
    mapping(address => address) public priceFeeds;
    
    // Eventos
    event StrategyCreated(address indexed user, uint256 strategyId, HedgeType hedgeType);
    event StrategyExecuted(address indexed user, uint256 strategyId, uint256 price);
    event StrategyUpdated(address indexed user, uint256 strategyId);
    event RebalanceTriggered(address indexed user, uint256 amount, uint256 price);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

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
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Cria uma nova estratégia de hedge
     */
    function createStrategy(
        address token,
        uint256 amount,
        uint256 targetPrice,
        uint256 threshold,
        HedgeType hedgeType
    ) external {
        require(priceFeeds[token] != address(0), "Token nao suportado");
        require(amount > 0, "Quantidade invalida");
        require(threshold > 0 && threshold <= 100, "Threshold invalido");

        HedgeStrategy memory newStrategy = HedgeStrategy({
            token: token,
            amount: amount,
            targetPrice: targetPrice,
            threshold: threshold,
            isActive: true,
            hedgeType: hedgeType
        });

        userStrategies[msg.sender].push(newStrategy);
        emit StrategyCreated(msg.sender, userStrategies[msg.sender].length - 1, hedgeType);
    }

    /**
     * @dev Verifica se alguma estratégia precisa ser executada
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view returns (bool upkeepNeeded, bytes memory performData) {
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

    /**
     * @dev Executa a estratégia de hedge
     */
    function performUpkeep(bytes calldata performData) external {
        (address user, uint256 strategyId, uint256 currentPrice) = abi.decode(performData, (address, uint256, uint256));
        
        HedgeStrategy storage strategy = userStrategies[user][strategyId];
        require(strategy.isActive, "Estrategia inativa");

        if (strategy.hedgeType == HedgeType.REBALANCE) {
            executeRebalance(user, strategyId, currentPrice);
        } else {
            executeHedge(user, strategyId, currentPrice);
        }

        emit StrategyExecuted(user, strategyId, currentPrice);
    }

    /**
     * @dev Executa rebalanceamento automático
     */
    function executeRebalance(address user, uint256 strategyId, uint256 currentPrice) internal {
        HedgeStrategy storage strategy = userStrategies[user][strategyId];
        
        uint256 targetAmount = (strategy.amount * strategy.targetPrice) / currentPrice;
        uint256 difference = targetAmount > strategy.amount ? 
            targetAmount - strategy.amount : strategy.amount - targetAmount;
        
        if (difference * 100 / strategy.amount >= strategy.threshold) {
            strategy.amount = targetAmount;
            emit RebalanceTriggered(user, targetAmount, currentPrice);
        }
    }

    /**
     * @dev Executa estratégia de hedge (stop loss ou take profit)
     */
    function executeHedge(address user, uint256 strategyId, uint256 currentPrice) internal {
        HedgeStrategy storage strategy = userStrategies[user][strategyId];
        
        if (strategy.hedgeType == HedgeType.STOP_LOSS && currentPrice <= strategy.targetPrice) {
            strategy.isActive = false;
        } else if (strategy.hedgeType == HedgeType.TAKE_PROFIT && currentPrice >= strategy.targetPrice) {
            strategy.isActive = false;
        }
    }

    /**
     * @dev Verifica se uma estratégia precisa ser executada
     */
    function checkStrategy(HedgeStrategy memory strategy) internal view returns (bool, uint256) {
        // Chama o price feed via low-level call
        (bool success, bytes memory data) = priceFeeds[strategy.token].staticcall(
            abi.encodeWithSignature("latestRoundData()")
        );
        require(success, "Price feed call failed");
        
        (, int256 price,,,) = abi.decode(data, (uint80, int256, uint256, uint256, uint80));
        uint256 currentPrice = uint256(price);

        if (strategy.hedgeType == HedgeType.REBALANCE) {
            uint256 targetAmount = (strategy.amount * strategy.targetPrice) / currentPrice;
            uint256 difference = targetAmount > strategy.amount ? 
                targetAmount - strategy.amount : strategy.amount - targetAmount;
            
            return (difference * 100 / strategy.amount >= strategy.threshold, currentPrice);
        } else if (strategy.hedgeType == HedgeType.STOP_LOSS) {
            return (currentPrice <= strategy.targetPrice, currentPrice);
        } else {
            return (currentPrice >= strategy.targetPrice, currentPrice);
        }
    }

    /**
     * @dev Retorna todas as estratégias de um usuário
     */
    function getUserStrategies(address user) external view returns (HedgeStrategy[] memory) {
        return userStrategies[user];
    }

    /**
     * @dev Retorna todos os usuários que têm estratégias
     */
    function getAllUsers() internal view returns (address[] memory) {
        // Implementação simplificada - em produção, você precisaria de um mecanismo mais eficiente
        address[] memory users = new address[](1);
        users[0] = msg.sender;
        return users;
    }

    /**
     * @dev Atualiza os parâmetros de uma estratégia
     */
    function updateStrategy(
        uint256 strategyId,
        uint256 newTargetPrice,
        uint256 newThreshold
    ) external {
        require(strategyId < userStrategies[msg.sender].length, "Estrategia nao encontrada");
        require(newThreshold > 0 && newThreshold <= 100, "Threshold invalido");

        HedgeStrategy storage strategy = userStrategies[msg.sender][strategyId];
        strategy.targetPrice = newTargetPrice;
        strategy.threshold = newThreshold;

        emit StrategyUpdated(msg.sender, strategyId);
    }

    /**
     * @dev Desativa uma estratégia
     */
    function deactivateStrategy(uint256 strategyId) external {
        require(strategyId < userStrategies[msg.sender].length, "Estrategia nao encontrada");
        userStrategies[msg.sender][strategyId].isActive = false;
        emit StrategyUpdated(msg.sender, strategyId);
    }
} 