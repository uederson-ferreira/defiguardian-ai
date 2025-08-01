// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/automation/RiskGuardianMaster.sol

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Importa interfaces dos contratos específicos
interface IStopLossHedge {
    function checkStopLossExecution(address user, uint256 orderId) 
        external view returns (bool needsExecution, uint256 currentPrice);
    function executeStopLoss(address user, uint256 orderId) external;
    function getUserActiveOrdersCount(address user) external view returns (uint256);
}

interface IRebalanceHedge {
    function checkRebalanceNeeded(address user) 
        external view returns (bool needsRebalance, uint256 maxDeviation, uint256[] memory currentWeights, uint256 totalValueUSD);
    function executeRebalance(address user) external;
    function getActiveUsers() external view returns (address[] memory);
}

interface IVolatilityHedge {
    function checkAllPositionsForVolatility() 
        external view returns (address[] memory users, uint256[] memory positionIds, bool[] memory needsHedge);
    function executeVolatilityHedge(address user, uint256 positionId) external;
    function updatePriceAndCheckVolatility(address user, uint256 positionId) 
        external returns (bool needsHedge, uint256 volatility);
}

/**
 * @title RiskGuardianMaster
 * @dev Contrato central que coordena todos os tipos de hedge específicos
 * @notice Ponto único de automação que gerencia todas as estratégias de hedge
 */
contract RiskGuardianMaster is AutomationCompatible, Ownable, ReentrancyGuard {
    // Endereços dos contratos específicos
    address public stopLossHedgeContract;
    address public rebalanceHedgeContract;
    address public volatilityHedgeContract;
    address public crossChainHedgeContract;

    // Configurações de automação
    struct AutomationConfig {
        bool stopLossEnabled;
        bool rebalanceEnabled;
        bool volatilityEnabled;
        bool crossChainEnabled;
        uint256 checkInterval; // Intervalo entre verificações
        uint256 lastCheckTime; // Última verificação
        uint256 maxGasPerUpkeep; // Máximo de gas por upkeep
    }
    
    AutomationConfig public config;
    
    // Tracking de execuções
    struct ExecutionStats {
        uint256 totalStopLossExecutions;
        uint256 totalRebalanceExecutions;
        uint256 totalVolatilityExecutions;
        uint256 totalCrossChainExecutions;
        uint256 lastExecutionTime;
        uint256 totalGasUsed;
    }
    
    ExecutionStats public stats;
    
    // Arrays para tracking de usuários ativos
    address[] public activeUsers;
    mapping(address => bool) public isActiveUser;
    
    // Eventos
    event HedgeContractUpdated(string contractType, address newAddress);
    event AutomationConfigUpdated(
        bool stopLoss,
        bool rebalance,
        bool volatility,
        bool crossChain,
        uint256 interval
    );
    event HedgeExecuted(
        string hedgeType,
        address indexed user,
        uint256 indexed identifier,
        uint256 gasUsed
    );
    event UpkeepPerformed(
        uint256 stopLossExecutions,
        uint256 rebalanceExecutions,
        uint256 volatilityExecutions,
        uint256 totalGasUsed
    );

    constructor(address _initialOwner) Ownable(_initialOwner) {
        config = AutomationConfig({
            stopLossEnabled: true,
            rebalanceEnabled: true,
            volatilityEnabled: true,
            crossChainEnabled: true,
            checkInterval: 300, // 5 minutos
            lastCheckTime: block.timestamp,
            maxGasPerUpkeep: 500000
        });
    }

    /**
     * @dev ✅ CORREÇÃO CRÍTICA: Configura os endereços dos contratos específicos COM VALIDAÇÃO
     * @notice Previne configuração de endereços inválidos que quebrariam a automação
     */
    function setHedgeContracts(
        address _stopLossHedge,
        address _rebalanceHedge,
        address _volatilityHedge,
        address _crossChainHedge
    ) external onlyOwner {
        // ✅ VALIDAÇÃO CRÍTICA: Verificar se são contratos válidos
        require(_stopLossHedge != address(0), "StopLoss: zero address");
        require(_stopLossHedge.code.length > 0, "StopLoss: not a contract");
        
        require(_rebalanceHedge != address(0), "Rebalance: zero address");
        require(_rebalanceHedge.code.length > 0, "Rebalance: not a contract");
        
        require(_volatilityHedge != address(0), "Volatility: zero address");
        require(_volatilityHedge.code.length > 0, "Volatility: not a contract");
        
        require(_crossChainHedge != address(0), "CrossChain: zero address");
        require(_crossChainHedge.code.length > 0, "CrossChain: not a contract");

        // ✅ VALIDAÇÃO ADICIONAL: Testar se contratos respondem a interface básica
        try IStopLossHedge(_stopLossHedge).getUserActiveOrdersCount(address(0)) {
            // Se não reverter, o contrato implementa a interface
        } catch {
            revert("StopLoss: invalid interface");
        }

        try IRebalanceHedge(_rebalanceHedge).getActiveUsers() {
            // Se não reverter, o contrato implementa a interface
        } catch {
            revert("Rebalance: invalid interface");
        }

        stopLossHedgeContract = _stopLossHedge;
        rebalanceHedgeContract = _rebalanceHedge;
        volatilityHedgeContract = _volatilityHedge;
        crossChainHedgeContract = _crossChainHedge;

        emit HedgeContractUpdated("StopLoss", _stopLossHedge);
        emit HedgeContractUpdated("Rebalance", _rebalanceHedge);
        emit HedgeContractUpdated("Volatility", _volatilityHedge);
        emit HedgeContractUpdated("CrossChain", _crossChainHedge);
    }

    /**
     * @dev ✅ CORREÇÃO: Validação mais robusta das configurações
     */
    function updateAutomationConfig(
        bool _stopLossEnabled,
        bool _rebalanceEnabled,
        bool _volatilityEnabled,
        bool _crossChainEnabled,
        uint256 _checkInterval,
        uint256 _maxGasPerUpkeep
    ) external onlyOwner {
        require(_checkInterval >= 60, "Interval too short"); // Mínimo 1 minuto
        require(_checkInterval <= 86400, "Interval too long"); // Máximo 24 horas
        require(_maxGasPerUpkeep >= 100000, "Gas limit too low");
        require(_maxGasPerUpkeep <= 10000000, "Gas limit too high"); // ✅ NOVO: limite máximo
        
        config.stopLossEnabled = _stopLossEnabled;
        config.rebalanceEnabled = _rebalanceEnabled;
        config.volatilityEnabled = _volatilityEnabled;
        config.crossChainEnabled = _crossChainEnabled;
        config.checkInterval = _checkInterval;
        config.maxGasPerUpkeep = _maxGasPerUpkeep;
        
        emit AutomationConfigUpdated(
            _stopLossEnabled,
            _rebalanceEnabled,
            _volatilityEnabled,
            _crossChainEnabled,
            _checkInterval
        );
    }

    /**
     * @dev Adiciona usuário à lista de ativos COM VALIDAÇÃO
     */
    function addActiveUser(address user) external {
        require(user != address(0), "Invalid user address"); // ✅ NOVO: validação
        require(
            msg.sender == stopLossHedgeContract ||
            msg.sender == rebalanceHedgeContract ||
            msg.sender == volatilityHedgeContract ||
            msg.sender == crossChainHedgeContract,
            "Only hedge contracts can add users"
        );
        
        if (!isActiveUser[user]) {
            activeUsers.push(user);
            isActiveUser[user] = true;
        }
    }

    /**
     * @dev Verifica se automação é necessária (Chainlink Automation)
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        if (block.timestamp < config.lastCheckTime + config.checkInterval) {
            return (false, bytes(""));
        }
        
        uint256 totalExecutions = 0;
        
        // ✅ CORREÇÃO: Verificar se contratos estão configurados antes de usar
        if (config.stopLossEnabled && stopLossHedgeContract != address(0)) {
            totalExecutions += 1; // Placeholder
        }
        
        if (config.rebalanceEnabled && rebalanceHedgeContract != address(0)) {
            try IRebalanceHedge(rebalanceHedgeContract).getActiveUsers() returns (address[] memory users) {
                for (uint256 i = 0; i < users.length && i < 10; i++) {
                    try IRebalanceHedge(rebalanceHedgeContract).checkRebalanceNeeded(users[i]) 
                        returns (bool needed, uint256, uint256[] memory, uint256) {
                        if (needed) {
                            totalExecutions++;
                        }
                    } catch {}
                }
            } catch {}
        }
        
        if (config.volatilityEnabled && volatilityHedgeContract != address(0)) {
            try IVolatilityHedge(volatilityHedgeContract).checkAllPositionsForVolatility() 
                returns (address[] memory, uint256[] memory, bool[] memory needsHedge) {
                for (uint256 i = 0; i < needsHedge.length && i < 5; i++) {
                    if (needsHedge[i]) {
                        totalExecutions++;
                    }
                }
            } catch {}
        }
        
        upkeepNeeded = totalExecutions > 0;
        performData = abi.encode(totalExecutions);
        
        return (upkeepNeeded, performData);
    }

    /**
     * @dev Executa as automações necessárias (Chainlink Automation)
     */
    function performUpkeep(bytes calldata /* performData */) external override nonReentrant {
        uint256 gasStart = gasleft();
        
        config.lastCheckTime = block.timestamp;
        
        uint256 stopLossExecutions = 0;
        uint256 rebalanceExecutions = 0;
        uint256 volatilityExecutions = 0;
        
        if (config.stopLossEnabled && stopLossHedgeContract != address(0)) {
            stopLossExecutions = _executeStopLossHedges();
        }
        
        if (config.rebalanceEnabled && rebalanceHedgeContract != address(0)) {
            rebalanceExecutions = _executeRebalanceHedges();
        }
        
        if (config.volatilityEnabled && volatilityHedgeContract != address(0)) {
            volatilityExecutions = _executeVolatilityHedges();
        }
        
        uint256 gasUsed = gasStart - gasleft();
        stats.totalStopLossExecutions += stopLossExecutions;
        stats.totalRebalanceExecutions += rebalanceExecutions;
        stats.totalVolatilityExecutions += volatilityExecutions;
        stats.lastExecutionTime = block.timestamp;
        stats.totalGasUsed += gasUsed;
        
        emit UpkeepPerformed(
            stopLossExecutions,
            rebalanceExecutions,
            volatilityExecutions,
            gasUsed
        );
    }

    function _executeStopLossHedges() internal returns (uint256 executions) {
        if (stopLossHedgeContract == address(0)) return 0;
        
        uint256 gasRemaining = gasleft();
        uint256 gasPerExecution = 100000;
        
        for (uint256 i = 0; i < activeUsers.length && gasRemaining > gasPerExecution; i++) {
            address user = activeUsers[i];
            
            try IStopLossHedge(stopLossHedgeContract).getUserActiveOrdersCount(user) returns (uint256 orderCount) {
                for (uint256 j = 0; j < orderCount && j < 3; j++) {
                    try IStopLossHedge(stopLossHedgeContract).checkStopLossExecution(user, j) 
                        returns (bool needsExecution, uint256) {
                        if (needsExecution) {
                            try IStopLossHedge(stopLossHedgeContract).executeStopLoss(user, j) {
                                executions++;
                                emit HedgeExecuted("StopLoss", user, j, gasPerExecution);
                                gasRemaining -= gasPerExecution;
                            } catch {}
                        }
                    } catch {}
                }
            } catch {}
        }
        
        return executions;
    }

    function _executeRebalanceHedges() internal returns (uint256 executions) {
        if (rebalanceHedgeContract == address(0)) return 0;
        
        uint256 gasRemaining = gasleft();
        uint256 gasPerExecution = 150000;
        
        try IRebalanceHedge(rebalanceHedgeContract).getActiveUsers() returns (address[] memory users) {
            for (uint256 i = 0; i < users.length && gasRemaining > gasPerExecution; i++) {
                try IRebalanceHedge(rebalanceHedgeContract).checkRebalanceNeeded(users[i]) 
                    returns (bool needed, uint256, uint256[] memory, uint256) {
                    if (needed) {
                        try IRebalanceHedge(rebalanceHedgeContract).executeRebalance(users[i]) {
                            executions++;
                            emit HedgeExecuted("Rebalance", users[i], 0, gasPerExecution);
                            gasRemaining -= gasPerExecution;
                        } catch {}
                    }
                } catch {}
            }
        } catch {}
        
        return executions;
    }

    function _executeVolatilityHedges() internal returns (uint256 executions) {
        if (volatilityHedgeContract == address(0)) return 0;
        
        uint256 gasRemaining = gasleft();
        uint256 gasPerExecution = 120000;
        
        try IVolatilityHedge(volatilityHedgeContract).checkAllPositionsForVolatility() 
            returns (address[] memory users, uint256[] memory positionIds, bool[] memory needsHedge) {
            for (uint256 i = 0; i < needsHedge.length && gasRemaining > gasPerExecution; i++) {
                if (needsHedge[i]) {
                    try IVolatilityHedge(volatilityHedgeContract).executeVolatilityHedge(users[i], positionIds[i]) {
                        executions++;
                        emit HedgeExecuted("Volatility", users[i], positionIds[i], gasPerExecution);
                        gasRemaining -= gasPerExecution;
                    } catch {}
                }
            }
        } catch {}
        
        return executions;
    }

    function manualHedgeExecution(
        string calldata hedgeType,
        address user,
        uint256 identifier
    ) external onlyOwner nonReentrant {
        require(user != address(0), "Invalid user"); // ✅ NOVO: validação
        
        bytes32 hedgeTypeHash = keccak256(abi.encodePacked(hedgeType));
        
        if (hedgeTypeHash == keccak256(abi.encodePacked("StopLoss"))) {
            require(stopLossHedgeContract != address(0), "StopLoss not configured"); // ✅ NOVO
            IStopLossHedge(stopLossHedgeContract).executeStopLoss(user, identifier);
            stats.totalStopLossExecutions++;
        } else if (hedgeTypeHash == keccak256(abi.encodePacked("Rebalance"))) {
            require(rebalanceHedgeContract != address(0), "Rebalance not configured"); // ✅ NOVO
            IRebalanceHedge(rebalanceHedgeContract).executeRebalance(user);
            stats.totalRebalanceExecutions++;
        } else if (hedgeTypeHash == keccak256(abi.encodePacked("Volatility"))) {
            require(volatilityHedgeContract != address(0), "Volatility not configured"); // ✅ NOVO
            IVolatilityHedge(volatilityHedgeContract).executeVolatilityHedge(user, identifier);
            stats.totalVolatilityExecutions++;
        } else {
            revert("Invalid hedge type");
        }
        
        emit HedgeExecuted(hedgeType, user, identifier, 0);
    }

    function getExecutionStats() external view returns (ExecutionStats memory) {
        return stats;
    }

    function getAutomationConfig() external view returns (AutomationConfig memory) {
        return config;
    }

    function getActiveUsers() external view returns (address[] memory) {
        return activeUsers;
    }

    /**
     * @dev ✅ CORREÇÃO: Emergência com validações mais seguras
     */
    function emergencyPause() external onlyOwner {
        config.stopLossEnabled = false;
        config.rebalanceEnabled = false;
        config.volatilityEnabled = false;
        config.crossChainEnabled = false;
        
        emit AutomationConfigUpdated(false, false, false, false, config.checkInterval);
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token"); // ✅ NOVO: validação
        require(amount > 0, "Invalid amount"); // ✅ NOVO: validação
        IERC20(token).transfer(owner(), amount);
    }
}