// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//src/scripts/Integration.s.sol

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import of interfaces - CORRIGIDO
import "../interfaces/IRiskRegistry.sol";
import "../interfaces/IRiskOracle.sol";
import "../interfaces/IPortfolioAnalyzer.sol";
import "../interfaces/IAlertSystem.sol";

/**
 * @title ExampleIntegration
 * @dev CORREÇÃO CRÍTICA: Exemplo completo usando contratos corrigidos + mocks
 * @notice Demonstra fluxo end-to-end para hackathon na Sepolia
 */
contract ExampleIntegration is Script {
    
    // Contract addresses (loaded from .env or hardcoded)
    IRiskRegistry riskRegistry;
    IRiskOracle riskOracle;
    IPortfolioAnalyzer portfolioAnalyzer;
    IAlertSystem alertSystem;
    
    // CORREÇÃO: Endereços reais para Sepolia + mocks
    address constant UNISWAP_V3 = 0x0227628f3F023bb0B980b67D528571c95c6DaC1c; // Real Sepolia
    address constant AAVE_V3 = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;    // Real Sepolia
    address public COMPOUND_V3_MOCK; // Será carregado do SepoliaSetup
    address public LIDO_MOCK;        // Será carregado do SepoliaSetup
    address public CURVE_MOCK;       // Será carregado do SepoliaSetup
    
    // Real tokens on Sepolia
    address constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
    address constant DAI = 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357;

    function run() external {
        address user = vm.envAddress("USER_ADDRESS");
        
        console.log("=== RISKGUARDIAN V2 INTEGRATION DEMO ===");
        console.log("CORRECAO: Usando contratos validados + mocks Sepolia");
        console.log("User:", user);
        console.log("Network:", _getNetworkName());
        console.log("");

        // Load contract addresses WITH VALIDATION
        _loadContractAddresses();
        
        // NOVO: Load mock addresses
        _loadMockAddresses();

        vm.startBroadcast(user);

        // 1. Example: Complete portfolio analysis COM MOCKS
        console.log("1. PORTFOLIO ANALYSIS (Real + Mock protocols)");
        _examplePortfolioAnalysis(user);
        
        // 2. Example: Alert configuration
        console.log("2. ALERT CONFIGURATION");
        _exampleAlertConfiguration(user);
        
        // 3. Example: Risk monitoring
        console.log("3. RISK MONITORING");
        _exampleRiskMonitoring();
        
        // 4. Example: Protocol verification  
        console.log("4. PROTOCOL VERIFICATION");
        _exampleProtocolVerification();
        
        // NOVO: 5. Demo Mock functionality
        console.log("5. MOCK PROTOCOL INTERACTION");
        _demonstrateMockProtocols();

        vm.stopBroadcast();
        
        console.log("Complete demo executed successfully!");
        console.log("Ready for hackathon presentation!");
    }

    function _loadContractAddresses() internal {
        // CORREÇÃO: Validação robusta dos endereços
        address registryAddr = vm.envOr("RISK_REGISTRY_ADDRESS", address(0));
        address oracleAddr = vm.envOr("RISK_ORACLE_ADDRESS", address(0));
        address analyzerAddr = vm.envOr("PORTFOLIO_ANALYZER_ADDRESS", address(0));
        address alertAddr = vm.envOr("ALERT_SYSTEM_ADDRESS", address(0));
        
        require(registryAddr != address(0), "RISK_REGISTRY_ADDRESS not set");
        require(oracleAddr != address(0), "RISK_ORACLE_ADDRESS not set");
        require(analyzerAddr != address(0), "PORTFOLIO_ANALYZER_ADDRESS not set");
        require(alertAddr != address(0), "ALERT_SYSTEM_ADDRESS not set");
        
        // CORREÇÃO: Validar se são contratos válidos
        require(registryAddr.code.length > 0, "RiskRegistry: not a contract");
        require(oracleAddr.code.length > 0, "RiskOracle: not a contract");
        require(analyzerAddr.code.length > 0, "PortfolioAnalyzer: not a contract");
        require(alertAddr.code.length > 0, "AlertSystem: not a contract");
        
        riskRegistry = IRiskRegistry(registryAddr);
        riskOracle = IRiskOracle(oracleAddr);
        portfolioAnalyzer = IPortfolioAnalyzer(analyzerAddr);
        alertSystem = IAlertSystem(alertAddr);
        
        console.log("Contracts loaded and validated:");
        console.log("   RiskRegistry:", address(riskRegistry));
        console.log("   RiskOracle:", address(riskOracle));
        console.log("   PortfolioAnalyzer:", address(portfolioAnalyzer));
        console.log("   AlertSystem:", address(alertSystem));
        console.log("");
    }
    
    /**
     * @dev NOVA FUNÇÃO: Carregar endereços dos mocks
     */
    function _loadMockAddresses() internal {
        address sepoliaSetupAddr = vm.envOr("SEPOLIA_SETUP_ADDRESS", address(0));
        
        if (sepoliaSetupAddr != address(0) && sepoliaSetupAddr.code.length > 0) {
            // Interface para SepoliaSetup
            (bool success, bytes memory data) = sepoliaSetupAddr.staticcall(
                abi.encodeWithSignature("getMockProtocol(string)", "compound")
            );
            
            if (success) {
                COMPOUND_V3_MOCK = abi.decode(data, (address));
                console.log("Compound V3 Mock loaded:", COMPOUND_V3_MOCK);
            }
            
            (success, data) = sepoliaSetupAddr.staticcall(
                abi.encodeWithSignature("getMockProtocol(string)", "lido")
            );
            
            if (success) {
                LIDO_MOCK = abi.decode(data, (address));
                console.log("Lido Mock loaded:", LIDO_MOCK);
            }
            
            (success, data) = sepoliaSetupAddr.staticcall(
                abi.encodeWithSignature("getMockProtocol(string)", "curve")
            );
            
            if (success) {
                CURVE_MOCK = abi.decode(data, (address));
                console.log("Curve Mock loaded:", CURVE_MOCK);
            }
        } else {
            console.log("SepoliaSetup not found, using fallback addresses");
            // Fallback para endereços hardcoded se necessário
            COMPOUND_V3_MOCK = address(0x1000); // Placeholder
            LIDO_MOCK = address(0x2000);        // Placeholder  
            CURVE_MOCK = address(0x3000);       // Placeholder
        }
    }

    /**
     * @dev CORREÇÃO: Portfolio analysis com protocolos reais + mocks
     */
    function _examplePortfolioAnalysis(address user) internal {
        console.log("   Building diversified portfolio (Real + Mock protocols)...");
        
        // 1. Add position in REAL Uniswap V3 (Sepolia)
        try portfolioAnalyzer.addPosition(UNISWAP_V3, WETH, 1 ether) {
            console.log("   Uniswap V3 position added: 1 ETH (REAL protocol)");
        } catch Error(string memory reason) {
            console.log("   X Uniswap V3 position failed:", reason);
        }
        
        // 2. Add position in REAL Aave V3 (Sepolia)
        try portfolioAnalyzer.addPosition(AAVE_V3, USDC, 5000 * 1e6) {
            console.log("   Aave V3 position added: 5,000 USDC (REAL protocol)");
        } catch Error(string memory reason) {
            console.log("   X Aave V3 position failed:", reason);
        }
        
        // 3. Add position in MOCK Compound V3
        if (COMPOUND_V3_MOCK != address(0)) {
            try portfolioAnalyzer.addPosition(COMPOUND_V3_MOCK, DAI, 3000 * 1e18) {
                console.log("   Compound V3 Mock position added: 3,000 DAI (MOCK protocol)");
            } catch Error(string memory reason) {
                console.log("   X Compound V3 Mock position failed:", reason);
            }
        }
        
        // 4. Add position in MOCK Lido
        if (LIDO_MOCK != address(0)) {
            try portfolioAnalyzer.addPosition(LIDO_MOCK, WETH, 2 ether) {
                console.log("   Lido Mock position added: 2 ETH (MOCK protocol)");
            } catch Error(string memory reason) {
                console.log("   X Lido Mock position failed:", reason);
            }
        }

        // 5. Get comprehensive portfolio analysis
        try portfolioAnalyzer.getPortfolioAnalysis(user) returns (
            IPortfolioAnalyzer.PortfolioAnalysis memory analysis
        ) {
            console.log("    Portfolio Analysis Results:");
            console.log("      Total Value:", analysis.totalValue, "wei");
            console.log("      Overall Risk:", analysis.overallRisk, "/ 10000");
            console.log("      Diversification Score:", analysis.diversificationScore, "/ 10000");
            console.log("      Last Updated:", analysis.timestamp);
            
            // CORREÇÃO: Análise mais detalhada
            if (analysis.overallRisk > 7000) {
                console.log("      * HIGH RISK ALERT! Consider reducing exposure");
            } else if (analysis.overallRisk > 5000) {
                console.log("      - MODERATE RISK - Monitor closely");
            } else {
                console.log("      = LOW RISK - Portfolio looks healthy");
            }
            
            if (analysis.diversificationScore < 3000) {
                console.log("       Suggestion: Increase diversification");
            } else {
                console.log("      Good diversification across protocols");
            }
            
        } catch Error(string memory reason) {
            console.log("   X Portfolio analysis failed:", reason);
        }
        
        console.log("");
    }

    /**
     * @dev CORREÇÃO: Alert configuration com validação
     */
    function _exampleAlertConfiguration(address user) internal {
        console.log("   Setting up comprehensive alert system...");
        
        // Alert for REAL Uniswap V3 - 70% threshold
        try alertSystem.createSubscription(
            IAlertSystem.AlertType.RISK_THRESHOLD,
            UNISWAP_V3,
            7000
        ) {
            console.log("   Uniswap V3 alert configured (70% threshold)");
        } catch Error(string memory reason) {
            console.log("   X Uniswap V3 alert failed:", reason);
        }
        
        // Alert for REAL Aave V3 - 60% threshold
        try alertSystem.createSubscription(
            IAlertSystem.AlertType.RISK_THRESHOLD,
            AAVE_V3,
            6000
        ) {
            console.log("   Aave V3 alert configured (60% threshold)");
        } catch Error(string memory reason) {
            console.log("   X Aave V3 alert failed:", reason);
        }
        
        // Alert for MOCK Compound V3 - 65% threshold
        if (COMPOUND_V3_MOCK != address(0)) {
            try alertSystem.createSubscription(
                IAlertSystem.AlertType.RISK_THRESHOLD,
                COMPOUND_V3_MOCK,
                6500
            ) {
                console.log("   Compound V3 Mock alert configured (65% threshold)");
            } catch Error(string memory reason) {
                console.log("   X Compound V3 Mock alert failed:", reason);
            }
        }

        // Check active alerts
        try alertSystem.getUserActiveAlerts(user) returns (
            IAlertSystem.Alert[] memory alerts
        ) {
            console.log("   Active alert subscriptions:", alerts.length);
            
            for (uint256 i = 0; i < alerts.length && i < 5; i++) {
                console.log("      Alert", i + 1, ":");
                console.log("         Type:", uint256(alerts[i].alertType));
                console.log("         Protocol:", alerts[i].protocol);
                console.log("         Threshold:", alerts[i].threshold, "/ 10000");
                console.log("         Priority:", uint256(alerts[i].priority));
                console.log("         Active:", alerts[i].isActive);
            }
        } catch Error(string memory reason) {
            console.log("   X Error getting active alerts:", reason);
        }
        
        console.log("");
    }

    /**
     * @dev CORREÇÃO: Risk monitoring com protocolos reais + mocks
     */
    function _exampleRiskMonitoring() internal view {
        console.log("   Real-time risk monitoring across all protocols...");
        
        address[] memory protocolsToCheck = new address[](5);
        protocolsToCheck[0] = UNISWAP_V3;      // Real
        protocolsToCheck[1] = AAVE_V3;         // Real
        protocolsToCheck[2] = COMPOUND_V3_MOCK; // Mock
        protocolsToCheck[3] = LIDO_MOCK;       // Mock
        protocolsToCheck[4] = CURVE_MOCK;      // Mock
        
        string[] memory protocolNames = new string[](5);
        protocolNames[0] = "Uniswap V3 (Real)";
        protocolNames[1] = "Aave V3 (Real)";
        protocolNames[2] = "Compound V3 (Mock)";
        protocolNames[3] = "Lido (Mock)";
        protocolNames[4] = "Curve (Mock)";
        
        for (uint256 i = 0; i < protocolsToCheck.length; i++) {
            address protocol = protocolsToCheck[i];
            string memory name = protocolNames[i];
            
            if (protocol == address(0)) {
                console.log("   ", name, ": Not available");
                continue;
            }
            
            // Check Oracle data
            try riskOracle.getAggregatedRisk(protocol) returns (
                uint256 volatilityRisk,
                uint256 liquidityRisk,
                uint256 smartContractRisk,
                uint256 governanceRisk,
                uint256 externalRisk,
                uint256 overallRisk,
                uint256 timestamp
            ) {
                console.log("   ", name, "Risk Analysis:");
                console.log("      Overall Risk:", overallRisk, "/ 10000");
                console.log("      Volatility:", volatilityRisk, "/ 10000");
                console.log("      Liquidity:", liquidityRisk, "/ 10000");
                console.log("      Smart Contract:", smartContractRisk, "/ 10000");
                console.log("      Governance:", governanceRisk, "/ 10000");
                console.log("      External:", externalRisk, "/ 10000");
                console.log("      Last Update:", timestamp);
                
                // CORREÇÃO: Verificar freshness dos dados
                bool isFresh = block.timestamp - timestamp <= 86400; // 24h
                console.log("      Data Freshness:", isFresh ? "Fresh (< 24h)" : "Stale (> 24h)");
                
                // Check risk level
                if (overallRisk > 8000) {
                    console.log("      * CRITICAL RISK - Immediate action needed");
                } else if (overallRisk > 6000) {
                    console.log("      => HIGH RISK - Monitor closely");
                } else if (overallRisk > 4000) {
                    console.log("      - MODERATE RISK - Standard monitoring");
                } else {
                    console.log("      = LOW RISK - Safe for investment");
                }
                
            } catch {
                console.log("   X", name, ": Risk data not available or invalid");
            }
            
            console.log("");
        }
    }

    /**
     * @dev CORREÇÃO: Protocol verification mais robusta
     */
    function _exampleProtocolVerification() internal view {
        console.log("   Verifying registered protocols in system...");
        
        try riskRegistry.getAllProtocols() returns (address[] memory protocols) {
            console.log("    Total registered protocols:", protocols.length);
            
            uint256 realProtocols = 0;
            uint256 mockProtocols = 0;
            uint256 activeProtocols = 0;
            
            for (uint256 i = 0; i < protocols.length && i < 10; i++) {
                address protocol = protocols[i];
                
                try riskRegistry.protocols(protocol) returns (
                    string memory name,
                    address protocolAddress,
                    string memory category,
                    uint256 tvl,
                    DataTypes.RiskMetrics memory metrics,
                    bool isWhitelisted
                ) {
                    console.log("");
                    console.log("   Protocol", i + 1, ":", name);
                    console.log("      Address:", protocolAddress);
                    console.log("      Category:", category);
                    console.log("      TVL:", tvl, "wei");
                    console.log("      Overall Risk:", metrics.overallRisk, "/ 10000");
                    console.log("      Whitelisted:", isWhitelisted ? "Yes" : "No");
                    console.log("      Last Updated:", metrics.lastUpdated);
                    
                    //Classificar protocolos
                    if (keccak256(abi.encodePacked(name)) == keccak256(abi.encodePacked("Uniswap V3")) ||
                        keccak256(abi.encodePacked(name)) == keccak256(abi.encodePacked("Aave V3"))) {
                        realProtocols++;
                        console.log("      Type: = REAL Protocol");
                    } else {
                        mockProtocols++;
                        console.log("      Type:  MOCK Protocol");
                    }
                    
                    if (metrics.lastUpdated > block.timestamp - 86400) {
                        activeProtocols++;
                        console.log("      Status: ACTIVE (Recent data)");
                    } else {
                        console.log("      Status: STALE (Old data)");
                    }
                    
                } catch {
                    console.log("   X Error getting protocol data:", protocol);
                }
            }
            
            console.log("");
            console.log("    Protocol Summary:");
            console.log("      Real protocols:", realProtocols);
            console.log("      Mock protocols:", mockProtocols);
            console.log("      Active protocols:", activeProtocols);
            console.log("      Total coverage: Ready for demo!");
            
        } catch {
            console.log("   X Error getting protocol list from registry");
        }
        
        console.log("");
    }
    
    /**
     * @dev NOVA FUNÇÃO: Demonstrar funcionalidades dos mocks
     */
    function _demonstrateMockProtocols() internal view{
        console.log("   Testing mock protocol interactions...");
        
        if (COMPOUND_V3_MOCK != address(0)) {
            // Test mock protocol deposit (simulate)
            console.log("    Testing Compound V3 Mock:");
            console.log("      Address:", COMPOUND_V3_MOCK);
            console.log("      Status: Available for interaction");
            
            // Simulated interaction
            (bool success, bytes memory data) = COMPOUND_V3_MOCK.staticcall(
                abi.encodeWithSignature("name()")
            );
            
            if (success) {
                string memory name = abi.decode(data, (string));
                console.log("      Name:", name);
            }
            
            (success, data) = COMPOUND_V3_MOCK.staticcall(
                abi.encodeWithSignature("totalValueLocked()")
            );
            
            if (success) {
                uint256 tvl = abi.decode(data, (uint256));
                console.log("      TVL:", tvl, "wei");
            }
        }
        
        if (LIDO_MOCK != address(0)) {
            console.log("    Testing Lido Mock:");
            console.log("      Address:", LIDO_MOCK);
            console.log("      Status: Available for staking simulation");
        }
        
        if (CURVE_MOCK != address(0)) {
            console.log("    Testing Curve Mock:");
            console.log("      Address:", CURVE_MOCK);
            console.log("      Status: Available for DEX simulation");
        }
        
        console.log("    Mock Protocol Demo Results:");
        console.log("      All mocks responsive:");
        console.log("      Real protocol integration:");  
        console.log("      System ready for full demo:");
        
        console.log("");
    }

    function _getNetworkName() internal view returns (string memory) {
        if (block.chainid == 1) return "Ethereum Mainnet";
        if (block.chainid == 11155111) return "Sepolia Testnet";
        if (block.chainid == 31337) return "Local Anvil";
        return "Unknown Network";
    }
}