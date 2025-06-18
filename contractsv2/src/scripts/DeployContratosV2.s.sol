// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/scripts/DeployContratosV2.s.sol

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../core/ContractRegistry.sol";

import "../core/RiskRegistry.sol";
import "../core/RiskOracle.sol";
import "../core/PortfolioRiskAnalyzer.sol";
import "../automation/AlertSystem.sol";
import "../hedging/StopLossHedge.sol";
import "../hedging/RebalanceHedge.sol";
import "../hedging/VolatilityHedge.sol";
import "../hedging/CrossChainHedge.sol";
import "../automation/RiskGuardianMaster.sol";
import "../insurance/RiskInsurance.sol";

// Import das configurações
import "../config/Addresses.sol";
import "../config/ChainlinkFeeds.sol";

/**
 * @title DeployContratosV2
 * @dev Script completo para deploy e configuração da arquitetura V2
 */
contract DeployContratosV2 is Script {
    // Contratos deployados
    RiskRegistry public riskRegistry;
    RiskOracle public riskOracle;
    PortfolioRiskAnalyzer public portfolioAnalyzer;
    AlertSystem public alertSystem;
    StopLossHedge public stopLossHedge;
    RebalanceHedge public rebalanceHedge;
    VolatilityHedge public volatilityHedge;
    CrossChainHedge public crossChainHedge;
    RiskGuardianMaster public riskGuardianMaster;
    RiskInsurance public riskInsurance;

    // Configurações da rede
    uint256 public chainId;
    address public deployer;

    function run() external {
        deployer = vm.envAddress("DEPLOYER_ADDRESS");
        chainId = block.chainid;
        
        console.log("=== RISKGUARDIAN AI V2 - DEPLOY COMPLETO ===");
        console.log("Network:", _getNetworkName());
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("");

        vm.startBroadcast();
        ContractRegistry registry = new ContractRegistry();
        //RiskRegistry riskRegistry = new RiskRegistry();
        //RiskOracle riskOracle = new RiskOracle();
        PortfolioRiskAnalyzer analyzer = new PortfolioRiskAnalyzer(address(registry));
        //AlertSystem alertSystem = new AlertSystem(address(address(registry)));

        registry.setContract(keccak256("RiskRegistry"), address(riskRegistry));
        registry.setContract(keccak256("RiskOracle"), address(riskOracle));
        registry.setContract(keccak256("PortfolioRiskAnalyzer"), address(analyzer));

        // 1. Deploy dos contratos principais
        _deployCore();
        
        // 2. Deploy dos contratos de hedge
        _deployHedging();
        
        // 3. Deploy da automação
        _deployAutomation();
        
        // 4. Deploy do seguro
        _deployInsurance();
        
        // 5. Configuração inicial
        _setupInitialConfiguration();
        
        // 6. Configuração de dados reais
        _setupRealData();

        vm.stopBroadcast();
        
        console.log("=== DEPLOY COMPLETO - TODOS OS CONTRATOS ATIVOS! ===");
        
        // Print deployed addresses
        _printDeployedAddresses();
    }

    /**
     * @dev Deploy dos contratos centrais
     */
    function _deployCore() internal {
        console.log("1. Deploying core contracts...");
        
        // 1. RiskRegistry (base de tudo)
        console.log("   Deploying RiskRegistry...");
        riskRegistry = new RiskRegistry();
        console.log("RiskRegistry:", address(riskRegistry));
        
        // 2. RiskOracle (dados de risco)
        console.log("   Deploying RiskOracle...");
        riskOracle = new RiskOracle();
        console.log("RiskOracle:", address(riskOracle));
        
        // 3. PortfolioRiskAnalyzer (análise de portfólio)
        console.log("   Deploying PortfolioRiskAnalyzer...");
        portfolioAnalyzer = new PortfolioRiskAnalyzer(address(riskRegistry));
        console.log("PortfolioRiskAnalyzer:", address(portfolioAnalyzer));
        
        console.log("Core contracts deployed!");
        console.log("");
    }

    /**
     * @dev Deploy dos contratos de hedge
     */
    function _deployHedging() internal {
        console.log("2. Deploying hedge contracts...");
        
        // 1. StopLossHedge
        console.log("   Deploying StopLossHedge...");
        stopLossHedge = new StopLossHedge();
        console.log("StopLossHedge:", address(stopLossHedge));
        
        // 2. RebalanceHedge
        console.log("   Deploying RebalanceHedge...");
        rebalanceHedge = new RebalanceHedge();
        console.log("RebalanceHedge:", address(rebalanceHedge));
        
        // 3. VolatilityHedge
        console.log("   Deploying VolatilityHedge...");
        volatilityHedge = new VolatilityHedge();
        console.log("VolatilityHedge:", address(volatilityHedge));
        
        // 4. CrossChainHedge (apenas se CCIP disponível)
        if (_isCCIPSupported()) {
            console.log("   Deploying CrossChainHedge...");
            address ccipRouter = _getCCIPRouter();
            address linkToken = _getLinkToken();
            crossChainHedge = new CrossChainHedge(ccipRouter, linkToken);
            console.log("CrossChainHedge:", address(crossChainHedge));
        } else {
            console.log("CrossChainHedge skipped (CCIP not available)");
        }
        
        console.log("Hedge contracts deployed!");
        console.log("");
    }

    /**
     * @dev Deploy da automação
     */
    function _deployAutomation() internal {
        console.log("3. Deploying automation...");
        
        // 1. AlertSystem
        console.log("   Deploying AlertSystem...");
        alertSystem = new AlertSystem(
            address(riskOracle),
            address(portfolioAnalyzer),
            address(riskRegistry)
        );
        console.log("AlertSystem:", address(alertSystem));
        
        // 2. RiskGuardianMaster (coordenador)
        console.log("   Deploying RiskGuardianMaster...");
        riskGuardianMaster = new RiskGuardianMaster();
        console.log("RiskGuardianMaster:", address(riskGuardianMaster));
        
        console.log("Automation deployed!");
        console.log("");
    }

    /**
     * @dev Deploy do seguro
     */
    function _deployInsurance() internal {
        console.log("4. Deploying insurance...");
        
        console.log("   Deploying RiskInsurance...");
        riskInsurance = new RiskInsurance(address(portfolioAnalyzer));
        console.log("RiskInsurance:", address(riskInsurance));
        
        console.log("Insurance deployed!");
        console.log("");
    }

    /**
     * @dev Configuração inicial dos contratos
     */
    function _setupInitialConfiguration() internal {
        console.log("5. Initial configuration...");
        
        // Adicionar deployer como risk assessor
        console.log("   Configuring risk assessors...");
        riskRegistry.addRiskAssessor(deployer);
        
        // Adicionar deployer como risk provider no oracle
        console.log("   Configuring risk providers...");
        riskOracle.addRiskProvider(deployer, "Primary Risk Provider", 10000);
        
        // Configurar RiskGuardianMaster com endereços dos hedges
        console.log("   Configuring RiskGuardianMaster...");
        riskGuardianMaster.setHedgeContracts(
            address(stopLossHedge),
            address(rebalanceHedge),
            address(volatilityHedge),
            address(crossChainHedge)
        );
        
        console.log("Initial configuration complete!");
        console.log("");
    }

    /**
     * @dev Configuração com dados reais dos protocolos DeFi
     */
    function _setupRealData() internal {
        console.log("6. Configuring real data...");
        
        if (chainId == 1) {
            _setupMainnetData();
        } else if (chainId == 11155111) {
            _setupSepoliaData();
        } else {
            console.log("Network not supported for real data");
            return;
        }
        
        console.log("Real data configured!");
        console.log("");
    }

    /**
     * @dev Configuração de dados para Mainnet
     */
    function _setupMainnetData() internal {
        console.log("   Configuring Mainnet...");
        
        Addresses.MainnetProtocols memory protocols = Addresses.getMainnetProtocols();
        
        // Registrar protocolos principais
        _registerProtocol(protocols.uniswapV3Factory, "Uniswap V3", "dex", 3000, 2000, 1500, 2500);
        _registerProtocol(protocols.aaveV3Pool, "Aave V3", "lending", 3500, 2500, 2000, 3000);
        _registerProtocol(protocols.compoundV3USDC, "Compound V3", "lending", 3500, 1500, 2500, 4500);
        _registerProtocol(protocols.lidoStETH, "Lido stETH", "staking", 4000, 3000, 3000, 5000);
        _registerProtocol(protocols.curveRegistry, "Curve Finance", "dex", 5000, 2500, 3500, 5500);
        
        console.log("   Registered 5 protocols");
    }

    /**
     * @dev Configuração de dados para Sepolia
     */
    function _setupSepoliaData() internal {
        console.log("   Configuring Sepolia...");
        
        Addresses.SepoliaProtocols memory protocols = Addresses.getSepoliaProtocols();
        
        // Registrar protocolos disponíveis no Sepolia
        _registerProtocol(protocols.uniswapV3Factory, "Uniswap V3", "dex", 3000, 2000, 1500, 2500);
        _registerProtocol(protocols.aaveV3Pool, "Aave V3", "lending", 3500, 2500, 2000, 3000);
        
        console.log("   Registered 2 protocols");
    }

    /**
     * @dev Registra um protocolo com métricas de risco
     */
    function _registerProtocol(
        address protocolAddr,
        string memory name,
        string memory category,
        uint256 volatility,
        uint256 liquidity,
        uint256 smartContract,
        uint256 governance
    ) internal {
        riskRegistry.registerProtocol(protocolAddr, name, category);
        riskRegistry.updateRiskMetrics(protocolAddr, volatility, liquidity, smartContract, governance);
        
        // Configurar threshold no oracle
        uint256 threshold = (volatility + liquidity + smartContract + governance) / 4;
        riskOracle.setRiskThreshold(protocolAddr, threshold + 2000); // +20% para threshold
    }

    /**
     * @dev Print deployed addresses for reference
     */
    function _printDeployedAddresses() internal view {
        console.log("=== DEPLOYED ADDRESSES ===");
        console.log("RiskRegistry:        ", address(riskRegistry));
        console.log("RiskOracle:          ", address(riskOracle));
        console.log("PortfolioAnalyzer:   ", address(portfolioAnalyzer));
        console.log("AlertSystem:         ", address(alertSystem));
        console.log("StopLossHedge:       ", address(stopLossHedge));
        console.log("RebalanceHedge:      ", address(rebalanceHedge));
        console.log("VolatilityHedge:     ", address(volatilityHedge));
        console.log("CrossChainHedge:     ", address(crossChainHedge));
        console.log("RiskGuardianMaster:  ", address(riskGuardianMaster));
        console.log("RiskInsurance:       ", address(riskInsurance));
        console.log("=============================");
    }

    // ========== HELPER FUNCTIONS ==========

    function _getNetworkName() internal view returns (string memory) {
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia Testnet";
        if (chainId == 137) return "Polygon Mainnet";
        if (chainId == 42161) return "Arbitrum One";
        if (chainId == 31337) return "Local Anvil";
        return "Unknown Network";
    }

    function _isCCIPSupported() internal view returns (bool) {
        return chainId == 1 || chainId == 11155111; // Mainnet ou Sepolia
    }

    function _getCCIPRouter() internal view returns (address) {
        if (chainId == 1) return 0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D; // Mainnet
        if (chainId == 11155111) return 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59; // Sepolia
        return address(0);
    }

    function _getLinkToken() internal view returns (address) {
        if (chainId == 1) return 0x514910771AF9Ca656af840dff83E8264EcF986CA; // Mainnet
        if (chainId == 11155111) return 0x779877A7B0D9E8603169DdbD7836e478b4624789; // Sepolia
        return address(0);
    }
}