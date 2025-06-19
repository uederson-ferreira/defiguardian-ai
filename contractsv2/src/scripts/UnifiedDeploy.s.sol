// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//script/UnifiedDeploy.s.sol

import "forge-std/Script.sol";
import "forge-std/console.sol";

// CORREÇÃO: Imports corrigidos
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

// Importando apenas o arquivo que contém SepoliaSetup
import "../../test/mocks/SepoliaSetup.sol";

/**
 * @title UnifiedDeploy
 * @dev SCRIPT CRÍTICO: Deploy completo e validado para hackathon
 * @notice Deploy único que funciona em qualquer rede com validações robustas
 */
contract UnifiedDeploy is Script {
    
    // CORREÇÃO: Contratos com validação de deployment
    ContractRegistry public contractRegistry;
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
    
    // NOVO: Mocks para Sepolia
    SepoliaSetup public sepoliaSetup;
    
    // Deployment info
    address public deployer;
    uint256 public chainId;
    string public networkName;
    bool public isSepolia;
    bool public isMainnet;
    bool public isLocal;

    function run() external {
        deployer = vm.envAddress("DEPLOYER_ADDRESS");
        chainId = block.chainid;
        networkName = _getNetworkName();
        isSepolia = chainId == 11155111;
        isMainnet = chainId == 1;
        isLocal = chainId == 31337;
        
        console.log("=== RISKGUARDIAN AI V2 - UNIFIED DEPLOY ===");
        console.log("Correcoes aplicadas: Validacoes + Mocks + Calculos unificados");
        console.log("Network:", networkName);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Available ETH:", deployer.balance / 1e18, "ETH");
        console.log("");

        // VALIDAÇÃO: Verificar balance suficiente
        uint256 requiredETH = isSepolia ? 0.5 ether : (isMainnet ? 2 ether : 0.1 ether);
        require(deployer.balance >= requiredETH, "Insufficient ETH for deployment");

        vm.startBroadcast(deployer);

        // 1. Deploy core infrastructure
        console.log("STEP 1: Deploying Core Infrastructure...");
        _deployCore();
        
        // 2. Deploy hedge contracts
        console.log("STEP 2: Deploying Hedge Strategies...");
        _deployHedgeContracts();
        
        // 3. Deploy automation
        console.log("STEP 3: Deploying Automation System...");
        _deployAutomation();
        
        // 4. Deploy insurance
        console.log("STEP 4: Deploying Insurance System...");
        _deployInsurance();
        
        // 5. Deploy mocks if Sepolia
        if (isSepolia) {
            console.log("STEP 5: Deploying Sepolia Mocks...");
            _deploySepoliaMocks();
        }
        
        // 6. Configure integrations
        console.log("STEP 6: Configuring Integrations...");
        _configureIntegrations();
        
        // 7. Setup data
        console.log("STEP 7: Setting Up Initial Data...");
        _setupInitialData();
        
        // 8. Final validation
        console.log("STEP 8: Final Validation...");
        _validateDeployment();

        vm.stopBroadcast();
        
        // 9. Print deployment info
        _printDeploymentSummary();
        
        console.log("=== DEPLOYMENT COMPLETED SUCCESSFULLY ===");
        console.log("System is ready for hackathon demo!");
    }

    /**
     * @dev STEP 1: Deploy core infrastructure with validation
     */
    function _deployCore() internal {
        // 1. Contract Registry (central registry)
        console.log("   Deploying ContractRegistry...");
        contractRegistry = new ContractRegistry();
        _validateContract(address(contractRegistry), "ContractRegistry");
        
        // 2. Risk Registry (protocol registry)
        console.log("   Deploying RiskRegistry...");
        riskRegistry = new RiskRegistry();
        _validateContract(address(riskRegistry), "RiskRegistry");
        
        // 3. Risk Oracle (risk data aggregation)
        console.log("   Deploying RiskOracle...");
        riskOracle = new RiskOracle();
        _validateContract(address(riskOracle), "RiskOracle");
        
        // 4. Portfolio Analyzer (portfolio analysis)
        console.log("   Deploying PortfolioRiskAnalyzer...");
        portfolioAnalyzer = new PortfolioRiskAnalyzer(address(contractRegistry));
        _validateContract(address(portfolioAnalyzer), "PortfolioRiskAnalyzer");
        
        // 5. Alert System (notifications)
        console.log("   Deploying AlertSystem...");
        alertSystem = new AlertSystem(address(contractRegistry));
        _validateContract(address(alertSystem), "AlertSystem");
        
        // NOVO: Register contracts in registry
        contractRegistry.setContract(keccak256("RiskRegistry"), address(riskRegistry));
        contractRegistry.setContract(keccak256("RiskOracle"), address(riskOracle));
        contractRegistry.setContract(keccak256("PortfolioRiskAnalyzer"), address(portfolioAnalyzer));
        contractRegistry.setContract(keccak256("AlertSystem"), address(alertSystem));
        
        console.log("   Core infrastructure deployed and registered");
    }

    /**
     * @dev STEP 2: Deploy hedge contracts with network-specific config
     */
    function _deployHedgeContracts() internal {
        // 1. Stop Loss Hedge
        console.log("   Deploying StopLossHedge...");
        stopLossHedge = new StopLossHedge();
        _validateContract(address(stopLossHedge), "StopLossHedge");
        
        // 2. Rebalance Hedge
        console.log("   Deploying RebalanceHedge...");
        rebalanceHedge = new RebalanceHedge();
        _validateContract(address(rebalanceHedge), "RebalanceHedge");
        
        // 3. Volatility Hedge
        console.log("   Deploying VolatilityHedge...");
        volatilityHedge = new VolatilityHedge();
        _validateContract(address(volatilityHedge), "VolatilityHedge");
        
        // 4. Cross Chain Hedge (only if CCIP supported)
        if (_isCCIPSupported()) {
            console.log("   Deploying CrossChainHedge...");
            address ccipRouter = _getCCIPRouter();
            address linkToken = _getLinkToken();
            crossChainHedge = new CrossChainHedge(ccipRouter, linkToken);
            _validateContract(address(crossChainHedge), "CrossChainHedge");
        } else {
            console.log("CrossChainHedge skipped (CCIP not supported)");
        }
        
        console.log("   Hedge contracts deployed");
    }

    /**
     * @dev STEP 3: Deploy automation with validation
     */
    function _deployAutomation() internal {
        console.log("   Deploying RiskGuardianMaster...");
        riskGuardianMaster = new RiskGuardianMaster(deployer);
        _validateContract(address(riskGuardianMaster), "RiskGuardianMaster");
        
        console.log("   Automation system deployed");
    }

    /**
     * @dev STEP 4: Deploy insurance with validation
     */
    function _deployInsurance() internal {
        console.log("   Deploying RiskInsurance...");
        riskInsurance = new RiskInsurance(address(portfolioAnalyzer));
        _validateContract(address(riskInsurance), "RiskInsurance");
        
        // NOVO: Add initial funds to insurance pool
        uint256 initialPool = isSepolia ? 1 ether : (isLocal ? 10 ether : 0);
        if (initialPool > 0) {
            riskInsurance.addToPool{value: initialPool}();
            console.log("Added", initialPool / 1e18, "ETH to insurance pool");
        }
        
        console.log("   Insurance system deployed");
    }

    /**
     * @dev STEP 5: Deploy Sepolia mocks
     */
    function _deploySepoliaMocks() internal {
        console.log("   Deploying SepoliaSetup...");
        sepoliaSetup = new SepoliaSetup();
        _validateContract(address(sepoliaSetup), "SepoliaSetup");
        
        console.log("   Setting up mocks...");
        sepoliaSetup.setupSepoliaMocks();
        
        console.log("   Registering mocks in RiskRegistry...");
        sepoliaSetup.registerMocksInRiskRegistry(address(riskRegistry));
        
        console.log("   Setting up realistic risk data...");
        sepoliaSetup.setupRealisticRiskData(address(riskRegistry));
        
        console.log("   Sepolia mocks deployed and configured");
    }

    /**
     * @dev STEP 6: Configure integrations with validation
     */
    function _configureIntegrations() internal {
        // 1. Configure RiskGuardianMaster with hedge contracts
        if (address(crossChainHedge) == address(0)) {
            // Use placeholder for networks without CCIP
            crossChainHedge = CrossChainHedge(payable(address(1)));
        }
        
        console.log("   Configuring RiskGuardianMaster...");
        riskGuardianMaster.setHedgeContracts(
            address(stopLossHedge),
            address(rebalanceHedge),
            address(volatilityHedge),
            address(crossChainHedge)
        );
        
        // 2. Configure automation settings
        riskGuardianMaster.updateAutomationConfig(
            true,   // stopLoss enabled
            true,   // rebalance enabled
            !isLocal, // volatility enabled (disabled locally for stability)
            _isCCIPSupported(), // crossChain enabled only if supported
            isSepolia ? 180 : 300, // interval: 3min on Sepolia, 5min elsewhere
            isSepolia ? 500000 : 400000 // gas limit
        );
        
        // 3. Add deployer as risk assessor
        riskRegistry.addRiskAssessor(deployer);
        
        // 4. Add deployer as risk provider
        riskOracle.addRiskProvider(deployer, "Primary Risk Provider", 10000);
        
        console.log("   Integrations configured");
    }

    /**
     * @dev STEP 7: Setup initial data
     */
    function _setupInitialData() internal {
        if (isMainnet) {
            _setupMainnetData();
        } else if (isSepolia) {
            _setupSepoliaData();
        } else if (isLocal) {
            _setupLocalData();
        }
        
        console.log("   Initial data configured");
    }

    /**
     * @dev Setup Mainnet data
     */
    function _setupMainnetData() internal {
        console.log("   Configuring Mainnet protocols...");
        
        // Uniswap V3
        riskRegistry.registerProtocol(0x1F98431c8aD98523631AE4a59f267346ea31F984, "Uniswap V3", "dex");
        riskRegistry.updateRiskMetrics(0x1F98431c8aD98523631AE4a59f267346ea31F984, 3000, 2000, 1500, 2500);
        
        // Aave V3
        riskRegistry.registerProtocol(0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2, "Aave V3", "lending");
        riskRegistry.updateRiskMetrics(0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2, 3500, 2500, 2000, 3000);
        
        console.log("   Registered 2 mainnet protocols");
    }

    /**
     * @dev Setup Sepolia data (real + mocks)
     */
    function _setupSepoliaData() internal {
        console.log("   Configuring Sepolia protocols (real + mocks)...");
        
        // Real protocols
        riskRegistry.registerProtocol(0x0227628f3F023bb0B980b67D528571c95c6DaC1c, "Uniswap V3 (Sepolia)", "dex");
        riskRegistry.updateRiskMetrics(0x0227628f3F023bb0B980b67D528571c95c6DaC1c, 3000, 2000, 1500, 2500);
        
        riskRegistry.registerProtocol(0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951, "Aave V3 (Sepolia)", "lending");
        riskRegistry.updateRiskMetrics(0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951, 3500, 2500, 2000, 3000);
        
        console.log("   Registered 2 real + 5 mock protocols");
    }

    /**
     * @dev Setup local development data
     */
    function _setupLocalData() internal {
        console.log("   Configuring local mock protocols...");
        
        // Mock protocols for local development
        riskRegistry.registerProtocol(0x1F98431c8aD98523631AE4a59f267346ea31F984, "Uniswap V3 (Mock)", "dex");
        riskRegistry.updateRiskMetrics(0x1F98431c8aD98523631AE4a59f267346ea31F984, 3000, 2000, 1500, 2500);
        
        riskRegistry.registerProtocol(0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2, "Aave V3 (Mock)", "lending");
        riskRegistry.updateRiskMetrics(0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2, 3500, 2500, 2000, 3000);
        
        console.log("   Registered 2 local mock protocols");
    }

    /**
     * @dev STEP 8: Validate entire deployment
     */
    function _validateDeployment() internal view {
        console.log("   Running deployment validation...");
        
        // Validate core contracts
        require(address(contractRegistry) != address(0), "ContractRegistry not deployed");
        require(address(riskRegistry) != address(0), "RiskRegistry not deployed");
        require(address(riskOracle) != address(0), "RiskOracle not deployed");
        require(address(portfolioAnalyzer) != address(0), "PortfolioAnalyzer not deployed");
        require(address(alertSystem) != address(0), "AlertSystem not deployed");
        
        // Validate hedge contracts
        require(address(stopLossHedge) != address(0), "StopLossHedge not deployed");
        require(address(rebalanceHedge) != address(0), "RebalanceHedge not deployed");
        require(address(volatilityHedge) != address(0), "VolatilityHedge not deployed");
        
        // Validate automation
        require(address(riskGuardianMaster) != address(0), "RiskGuardianMaster not deployed");
        
        // Validate insurance
        require(address(riskInsurance) != address(0), "RiskInsurance not deployed");
        
        // Validate integrations
        require(contractRegistry.getContract(keccak256("RiskRegistry")) == address(riskRegistry), "Registry integration failed");
        
        console.log("   All validations passed");
    }

    /**
     * @dev Print comprehensive deployment summary
     */
    function _printDeploymentSummary() internal view {
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Network:", networkName);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("");
        
        console.log("CORE CONTRACTS:");
        console.log("   ContractRegistry:      ", address(contractRegistry));
        console.log("   RiskRegistry:          ", address(riskRegistry));
        console.log("   RiskOracle:            ", address(riskOracle));
        console.log("   PortfolioRiskAnalyzer: ", address(portfolioAnalyzer));
        console.log("   AlertSystem:           ", address(alertSystem));
        console.log("");
        
        console.log("HEDGE CONTRACTS:");
        console.log("   StopLossHedge:         ", address(stopLossHedge));
        console.log("   RebalanceHedge:        ", address(rebalanceHedge));
        console.log("   VolatilityHedge:       ", address(volatilityHedge));
        console.log("   CrossChainHedge:       ", address(crossChainHedge));
        console.log("");
        
        console.log("AUTOMATION:");
        console.log("   RiskGuardianMaster:    ", address(riskGuardianMaster));
        console.log("");
        
        console.log("INSURANCE:");
        console.log("   RiskInsurance:         ", address(riskInsurance));
        console.log("");
        
        if (isSepolia && address(sepoliaSetup) != address(0)) {
            console.log("SEPOLIA MOCKS:");
            console.log("   SepoliaSetup:          ", address(sepoliaSetup));
            console.log("   Compound V3 Mock:      ", sepoliaSetup.getMockProtocol("compound"));
            console.log("   Lido Mock:             ", sepoliaSetup.getMockProtocol("lido"));
            console.log("   Curve Mock:            ", sepoliaSetup.getMockProtocol("curve"));
            console.log("");
        }
        
        console.log("NEXT STEPS:");
        console.log("1. Copy addresses to .env file");
        console.log("2. Run integration test: forge script script/examples/Integration.s.sol");
        console.log("3. Test automation: forge script script/EmergencyActions.s.sol");
        console.log("4. Start demo with sample data");
        console.log("");
        
        console.log("SYSTEM STATUS: READY FOR DEMO!");
    }

    // ===== HELPER FUNCTIONS =====

    function _validateContract(address contractAddr, string memory name) internal view {
        require(contractAddr != address(0), string(abi.encodePacked(name, ": zero address")));
        require(contractAddr.code.length > 0, string(abi.encodePacked(name, ": no code")));
    }

    function _getNetworkName() internal view returns (string memory) {
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia Testnet";
        if (chainId == 137) return "Polygon Mainnet";
        if (chainId == 42161) return "Arbitrum One";
        if (chainId == 31337) return "Local Anvil";
        return "Unknown Network";
    }

    function _isCCIPSupported() internal view returns (bool) {
        return chainId == 1 || chainId == 11155111 || chainId == 137 || chainId == 42161;
    }

    function _getCCIPRouter() internal view returns (address) {
        if (chainId == 1) return 0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D; // Mainnet
        if (chainId == 11155111) return 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59; // Sepolia
        if (chainId == 137) return 0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe; // Polygon
        if (chainId == 42161) return 0x141fa059441E0ca23ce184B6A78bafD2A517DdE8; // Arbitrum
        return address(0);
    }

    function _getLinkToken() internal view returns (address) {
        if (chainId == 1) return 0x514910771AF9Ca656af840dff83E8264EcF986CA; // Mainnet
        if (chainId == 11155111) return 0x779877A7B0D9E8603169DdbD7836e478b4624789; // Sepolia
        if (chainId == 137) return 0xb0897686c545045aFc77CF20eC7A532E3120E0F1; // Polygon
        if (chainId == 42161) return 0xf97f4df75117a78c1A5a0DBb814Af92458539FB4; // Arbitrum
        return address(0);
    }
}