// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//src/scripts/SetupRealData.s.sol

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import of contracts
import "../core/RiskRegistry.sol";
import "../core/RiskOracle.sol";
import "../core/PortfolioRiskAnalyzer.sol";
import "../hedging/StopLossHedge.sol";
import "../hedging/RebalanceHedge.sol";
import "../hedging/VolatilityHedge.sol";

// Import of configurations
import "../config/Addresses.sol";
import "../config/ChainlinkFeeds.sol";

/**
 * @title SetupRealData
 * @dev Script to configure real data for DeFi protocols
 */
contract SetupRealData is Script {
    
    // Contracts
    RiskRegistry riskRegistry;
    RiskOracle riskOracle;
    PortfolioRiskAnalyzer portfolioAnalyzer;
    StopLossHedge stopLossHedge;
    RebalanceHedge rebalanceHedge;
    VolatilityHedge volatilityHedge;
    
    uint256 public chainId;
    address public deployer;

    function run() external {
        deployer = vm.envAddress("DEPLOYER_ADDRESS");
        chainId = block.chainid;
        
        console.log("CONFIGURING REAL DATA");
        console.log("Network:", _getNetworkName());
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("");

        // Load contract addresses
    _loadContractAddresses();

        vm.startBroadcast(deployer);

        // Configure data based on network
        if (chainId == 1) {
            _setupMainnetData();
        } else if (chainId == 11155111) {
            _setupSepoliaData();
        } else if (chainId == 31337) {
            _setupAnvilData();
        } else {
            revert("Unsuported NetWork");
        }

        vm.stopBroadcast();
        
        console.log("REAL DATA CONFIGURATION COMPLETE!");
    }

    function _loadContractAddresses() internal {
        // Carregar endereços do ambiente
        address registryAddr = vm.envAddress("RISK_REGISTRY_ADDRESS");
        address oracleAddr = vm.envAddress("RISK_ORACLE_ADDRESS");
        address analyzerAddr = vm.envAddress("PORTFOLIO_ANALYZER_ADDRESS");
        address stopLossAddr = vm.envOr("STOP_LOSS_HEDGE_ADDRESS", address(0));
        address rebalanceAddr = vm.envOr("REBALANCE_HEDGE_ADDRESS", address(0));
        address volatilityAddr = vm.envOr("VOLATILITY_HEDGE_ADDRESS", address(0));
        
        riskRegistry = RiskRegistry(registryAddr);
        riskOracle = RiskOracle(oracleAddr);
        portfolioAnalyzer = PortfolioRiskAnalyzer(analyzerAddr);
        
        if (stopLossAddr != address(0)) stopLossHedge = StopLossHedge(stopLossAddr);
        if (rebalanceAddr != address(0)) rebalanceHedge = RebalanceHedge(rebalanceAddr);
        if (volatilityAddr != address(0)) volatilityHedge = VolatilityHedge(volatilityAddr);
        
        console.log("Contracts loaded:");
        console.log("   RiskRegistry:", address(riskRegistry));
        console.log("   RiskOracle:", address(riskOracle));
        console.log("   PortfolioAnalyzer:", address(portfolioAnalyzer));
        console.log("");
    }

    /**
     * @dev Configurar dados para Ethereum Mainnet
     */
    function _setupMainnetData() internal {
        console.log("Configurando Ethereum Mainnet...");
        
        Addresses.MainnetProtocols memory protocols = Addresses.getMainnetProtocols();
        Addresses.MainnetTokens memory tokens = Addresses.getMainnetTokens();
        ChainlinkFeeds.MainnetFeeds memory feeds = ChainlinkFeeds.getMainnetFeeds();
        
        // 1. Registrar protocolos DeFi reais
        console.log("   Registrando protocolos DeFi...");
        
        _registerProtocol(
            protocols.uniswapV3Factory,
            "Uniswap V3",
            "dex",
            2500, 1500, 1000, 2000, 1000 // Baixo risco
        );
        
        _registerProtocol(
            protocols.aaveV3Pool,
            "Aave V3",
            "lending",
            3000, 2000, 1500, 2500, 1500 // Baixo-médio risco
        );
        
        _registerProtocol(
            protocols.compoundV3USDC,
            "Compound V3 USDC",
            "lending",
            3500, 1500, 2000, 3000, 2000 // Médio risco
        );
        
        _registerProtocol(
            protocols.lidoStETH,
            "Lido Staked ETH",
            "staking",
            4000, 2500, 2500, 3500, 2500 // Médio risco
        );
        
        _registerProtocol(
            protocols.curveRegistry,
            "Curve Finance",
            "dex",
            4500, 3000, 3000, 4000, 3000 // Médio-alto risco
        );
        
        _registerProtocol(
            protocols.balancerV2Vault,
            "Balancer V2",
            "dex",
            4000, 2500, 2500, 3500, 2500 // Médio risco
        );
        
        console.log("   Registrados 6 protocolos principais");
        
        // 2. Configurar price feeds Chainlink
        console.log("   Configurando price feeds...");
        
        _configurePriceFeed(tokens.WETH, feeds.ETH_USD, "WETH", 18);
        _configurePriceFeed(tokens.WBTC, feeds.WBTC_USD, "WBTC", 8);
        _configurePriceFeed(tokens.USDC, feeds.USDC_USD, "USDC", 6);
        _configurePriceFeed(tokens.USDT, feeds.USDT_USD, "USDT", 6);
        _configurePriceFeed(tokens.DAI, feeds.DAI_USD, "DAI", 18);
        _configurePriceFeed(tokens.LINK, feeds.LINK_USD, "LINK", 18);
        _configurePriceFeed(tokens.UNI, feeds.UNI_USD, "UNI", 18);
        _configurePriceFeed(tokens.AAVE, feeds.AAVE_USD, "AAVE", 18);
        _configurePriceFeed(tokens.COMP, feeds.COMP_USD, "COMP", 18);
        _configurePriceFeed(tokens.CRV, feeds.CRV_USD, "CRV", 18);
        _configurePriceFeed(tokens.LDO, feeds.LDO_USD, "LDO", 18);
        
        console.log("   Configurados 11 price feeds");
        
        // 3. Configurar thresholds de risco
        console.log("   Configurando thresholds de risco...");
        
        riskOracle.setRiskThreshold(protocols.uniswapV3Factory, 6000);  // 60%
        riskOracle.setRiskThreshold(protocols.aaveV3Pool, 5500);        // 55%
        riskOracle.setRiskThreshold(protocols.compoundV3USDC, 6500);    // 65%
        riskOracle.setRiskThreshold(protocols.lidoStETH, 7000);         // 70%
        riskOracle.setRiskThreshold(protocols.curveRegistry, 7500);     // 75%
        riskOracle.setRiskThreshold(protocols.balancerV2Vault, 7000);   // 70%
        
        console.log("   Configurados thresholds para 6 protocolos");
        
        console.log("Mainnet configurado com sucesso!");
    }

    /**
     * @dev Configurar dados para Sepolia Testnet
     */
    function _setupSepoliaData() internal {
        console.log("Configurando Sepolia Testnet...");
        
        Addresses.SepoliaProtocols memory protocols = Addresses.getSepoliaProtocols();
        Addresses.SepoliaTokens memory tokens = Addresses.getSepoliaTokens();
        ChainlinkFeeds.SepoliaFeeds memory feeds = ChainlinkFeeds.getSepoliaFeeds();
        
        // Registrar protocolos disponíveis no Sepolia
        console.log("   Registrando protocolos testnet...");
        
        _registerProtocol(
            protocols.uniswapV3Factory,
            "Uniswap V3 (Sepolia)",
            "dex",
            3000, 2000, 1500, 2500, 1500
        );
        
        _registerProtocol(
            protocols.aaveV3Pool,
            "Aave V3 (Sepolia)",
            "lending",
            3500, 2500, 2000, 3000, 2000
        );
        
        console.log("   Registrados 2 protocolos testnet");
        
        // Configurar price feeds
        console.log("   Configurando price feeds testnet...");
        
        _configurePriceFeed(tokens.WETH, feeds.ETH_USD, "WETH", 18);
        _configurePriceFeed(tokens.USDC, feeds.USDC_USD, "USDC", 6);
        _configurePriceFeed(tokens.DAI, feeds.DAI_USD, "DAI", 18);
        _configurePriceFeed(tokens.LINK, feeds.LINK_USD, "LINK", 18);
        _configurePriceFeed(tokens.UNI, feeds.UNI_USD, "UNI", 18);
        
        console.log("   Configurados 5 price feeds testnet");
        
        // Thresholds mais altos para testes
        riskOracle.setRiskThreshold(protocols.uniswapV3Factory, 8000);  // 80%
        riskOracle.setRiskThreshold(protocols.aaveV3Pool, 7500);        // 75%
        
        console.log("Sepolia configurado com sucesso!");
    }

    /**
     * @dev Configurar dados para Anvil local
     */
    function _setupAnvilData() internal {
        console.log("Configurando Anvil Local...");
        
        // Para Anvil, usar endereços mock mas dados realistas
        address mockUniswap = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
        address mockAave = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
        address mockCompound = 0xc3d688B66703497DAA19211EEdff47f25384cdc3;
        
        console.log("   Registrando protocolos mock...");
        
        _registerProtocol(
            mockUniswap,
            "Uniswap V3 (Mock)",
            "dex",
            3000, 2000, 1500, 2500, 1500
        );
        
        _registerProtocol(
            mockAave,
            "Aave V3 (Mock)",
            "lending",
            3500, 2500, 2000, 3000, 2000
        );
        
        _registerProtocol(
            mockCompound,
            "Compound V3 (Mock)",
            "lending",
            4000, 2000, 2500, 3500, 2500
        );
        
        console.log("   Registrados 3 protocolos mock");
        
        // Thresholds para desenvolvimento
        riskOracle.setRiskThreshold(mockUniswap, 6000);
        riskOracle.setRiskThreshold(mockAave, 6500);
        riskOracle.setRiskThreshold(mockCompound, 7000);
        
        console.log("Anvil configurado com sucesso!");
    }

    /**
     * @dev Registra protocolo com métricas de risco
     */
    function _registerProtocol(
        address protocolAddr,
        string memory name,
        string memory category,
        uint256 volatility,
        uint256 liquidity,
        uint256 smartContract,
        uint256 governance,
        uint256 externalRisk
    ) internal {
        // Registrar protocolo
        riskRegistry.registerProtocol(protocolAddr, name, category);
        
        // Atualizar métricas de risco
        riskRegistry.updateRiskMetrics(
            protocolAddr,
            volatility,
            liquidity,
            smartContract,
            governance
        );
        
        // Submeter dados no oracle
        riskOracle.submitRiskData(
            protocolAddr,
            volatility,
            liquidity,
            smartContract,
            governance,
            externalRisk
        );
        
        console.log("      ", name, "registrado");
    }

    /**
     * @dev Configura price feed para um token
     */
    function _configurePriceFeed(
        address token,
        address feed,
        string memory symbol,
        uint8 decimals
    ) internal {
        // PortfolioAnalyzer
        portfolioAnalyzer.setPriceFeed(token, feed);
        
        // StopLossHedge (se disponível)
        if (address(stopLossHedge) != address(0)) {
            stopLossHedge.configureToken(token, feed, 1e15); // Min 0.001 token
        }
        
        // RebalanceHedge (se disponível)
        if (address(rebalanceHedge) != address(0)) {
            rebalanceHedge.addSupportedToken(token, feed, decimals);
        }
        
        // VolatilityHedge (se disponível)
        if (address(volatilityHedge) != address(0)) {
            volatilityHedge.configureToken(token, feed, token, decimals, 50);
        }
        
        console.log("      ", symbol, "price feed configurado");
    }

    function _getNetworkName() internal view returns (string memory) {
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia Testnet";
        if (chainId == 31337) return "Local Anvil";
        return "Unknown Network";
    }
}
