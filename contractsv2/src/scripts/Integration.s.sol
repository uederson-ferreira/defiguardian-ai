// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import of interfaces - corrigir caminhos
import "../interfaces/IRiskRegistry.sol";
import "../interfaces/IRiskOracle.sol";
import "../interfaces/IPortfolioAnalyzer.sol";
import "../interfaces/IAlertSystem.sol";

/**
 * @title ExampleIntegration
 * @dev Complete example of how to use the integrated contracts
 */
contract ExampleIntegration is Script {
    
    // Contract addresses (loaded from .env or hardcoded)
    IRiskRegistry riskRegistry;
    IRiskOracle riskOracle;
    IPortfolioAnalyzer portfolioAnalyzer;
    IAlertSystem alertSystem;
    
    // Real DeFi protocols
    address constant UNISWAP_V3 = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address constant AAVE_V3 = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    address constant COMPOUND_V3 = 0xc3d688B66703497DAA19211EEdff47f25384cdc3;
    
    // Real tokens
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant USDC = 0xA0B86a33e6441b8c83cC13E5c48A5e4d25eC7e1C;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    function run() external {
        address user = vm.envAddress("USER_ADDRESS");
        
        console.log("=== RISKGUARDIAN V2 INTEGRATION EXAMPLE ===");
        console.log("User:", user);
        console.log("Network:", _getNetworkName());
        console.log("");

        // Load contract addresses
        _loadContractAddresses();

        vm.startBroadcast(user);

        // 1. Example: Complete portfolio analysis
        console.log("1. PORTFOLIO ANALYSIS");
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

        vm.stopBroadcast();
        
        console.log("Complete example executed!");
    }

    function _loadContractAddresses() internal {
        // Try to load from environment or use default addresses
        address registryAddr = vm.envOr("RISK_REGISTRY_ADDRESS", address(0));
        address oracleAddr = vm.envOr("RISK_ORACLE_ADDRESS", address(0));
        address analyzerAddr = vm.envOr("PORTFOLIO_ANALYZER_ADDRESS", address(0));
        address alertAddr = vm.envOr("ALERT_SYSTEM_ADDRESS", address(0));
        
        require(registryAddr != address(0), "RISK_REGISTRY_ADDRESS not set");
        require(oracleAddr != address(0), "RISK_ORACLE_ADDRESS not set");
        require(analyzerAddr != address(0), "PORTFOLIO_ANALYZER_ADDRESS not set");
        require(alertAddr != address(0), "ALERT_SYSTEM_ADDRESS not set");
        
        riskRegistry = IRiskRegistry(registryAddr);
        riskOracle = IRiskOracle(oracleAddr);
        portfolioAnalyzer = IPortfolioAnalyzer(analyzerAddr);
        alertSystem = IAlertSystem(alertAddr);
        
        console.log("Contracts loaded:");
        console.log("   RiskRegistry:", address(riskRegistry));
        console.log("   RiskOracle:", address(riskOracle));
        console.log("   PortfolioAnalyzer:", address(portfolioAnalyzer));
        console.log("   AlertSystem:", address(alertSystem));
        console.log("");
    }

    /**
     * @dev Complete example of portfolio analysis
     */
    function _examplePortfolioAnalysis(address user) internal {
        console.log("   Adding positions to portfolio...");
        
        // Add position in Uniswap V3
        try portfolioAnalyzer.addPosition(UNISWAP_V3, WETH, 1 ether) {
            console.log("   Uniswap V3 position added: 1 ETH");
        } catch {
            console.log("Error adding Uniswap V3 position");
        }
        
        // Add position in Aave V3
        try portfolioAnalyzer.addPosition(AAVE_V3, USDC, 5000 * 1e6) {
            console.log("   Aave V3 position added: 5,000 USDC");
        } catch {
            console.log("Error adding Aave V3 position");
        }
        
        // Get portfolio analysis
        try portfolioAnalyzer.getPortfolioAnalysis(user) returns (
            IPortfolioAnalyzer.PortfolioAnalysis memory analysis
        ) {
            console.log("   Portfolio Analysis:");
            console.log("      Total Value:", analysis.totalValue);
            console.log("      Overall Risk:", analysis.overallRisk, "/ 10000");
            console.log("      Diversification Score:", analysis.diversificationScore, "/ 10000");
            console.log("      Last Updated:", analysis.timestamp);
            
            if (analysis.overallRisk > 7000) {
                console.log("ATTENTION: High risk detected!");
            } else if (analysis.overallRisk > 5000) {
                console.log("Moderate risk");
            } else {
                console.log("   Low risk");
            }
        } catch {
            console.log("Error getting portfolio analysis");
        }
        
        console.log("");
    }

    /**
     * @dev Example of alert configuration
     */
    function _exampleAlertConfiguration(address user) internal {
        console.log("   Configuring risk alerts...");
        
        // Alert for Uniswap V3 - 70% threshold
        try alertSystem.createSubscription(
            IAlertSystem.AlertType.RISK_THRESHOLD,
            UNISWAP_V3,
            7000
        ) {
            console.log("   Uniswap V3 alert configured (70% threshold)");
        } catch {
            console.log("Error configuring Uniswap V3 alert");
        }
        
        // Alert for Aave V3 - 60% threshold
        try alertSystem.createSubscription(
            IAlertSystem.AlertType.RISK_THRESHOLD,
            AAVE_V3,
            6000
        ) {
            console.log("   Aave V3 alert configured (60% threshold)");
        } catch {
            console.log("Error configuring Aave V3 alert");
        }
        
        // Check active alerts
        try alertSystem.getUserActiveAlerts(user) returns (
            IAlertSystem.Alert[] memory alerts
        ) {
            console.log("Active alerts:", alerts.length);
            
            for (uint256 i = 0; i < alerts.length && i < 3; i++) {
                console.log("      Alert", i + 1, "- Type:", uint256(alerts[i].alertType));
                console.log("         Protocol:", alerts[i].protocol);
                console.log("         Threshold:", alerts[i].threshold);
                console.log("         Priority:", uint256(alerts[i].priority));
            }
        } catch {
            console.log("Error getting active alerts");
        }
        
        console.log("");
    }

    /**
     * @dev Example of real-time risk monitoring
     */
    function _exampleRiskMonitoring() internal view {
        console.log("   Checking current protocol risks...");
        
        address[] memory protocolsToCheck = new address[](3);
        protocolsToCheck[0] = UNISWAP_V3;
        protocolsToCheck[1] = AAVE_V3;
        protocolsToCheck[2] = COMPOUND_V3;
        
        string[] memory protocolNames = new string[](3);
        protocolNames[0] = "Uniswap V3";
        protocolNames[1] = "Aave V3";
        protocolNames[2] = "Compound V3";
        
        for (uint256 i = 0; i < protocolsToCheck.length; i++) {
            address protocol = protocolsToCheck[i];
            string memory name = protocolNames[i];
            
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
                console.log("!", name, "Risk Data:");
                console.log("      Overall Risk:", overallRisk, "/ 10000");
                console.log("      Volatility:", volatilityRisk, "/ 10000");
                console.log("      Liquidity:", liquidityRisk, "/ 10000");
                console.log("      Smart Contract:", smartContractRisk, "/ 10000");
                console.log("      Governance:", governanceRisk, "/ 10000");
                console.log("      External:", externalRisk, "/ 10000");
                console.log("      Last Update:", timestamp);
                
                // Check if data is updated
                bool isFresh = riskOracle.isRiskDataFresh(protocol);
                console.log("      Data Fresh:", isFresh ? "Yes" : "No");
                
            } catch {
                console.log("X", name, ": Risk data not available");
            }
            
            console.log("");
        }
    }

    /**
     * @dev Example of checking registered protocols
     */
    function _exampleProtocolVerification() internal view {
        console.log("   Checking registered protocols...");
        
        try riskRegistry.getAllProtocols() returns (address[] memory protocols) {
            console.log("   Total registered protocols:", protocols.length);
            
            for (uint256 i = 0; i < protocols.length && i < 5; i++) {
                address protocol = protocols[i];
                
                try riskRegistry.protocols(protocol) returns (
                    string memory name,
                    address protocolAddress,
                    string memory category,
                    uint256 tvl,
                    IRiskRegistry.RiskMetrics memory metrics,
                    bool isWhitelisted
                ) {
                    console.log("");
                    console.log("   Protocol", i + 1, ":", name);
                    console.log("      Address:", protocolAddress);
                    console.log("      Category:", category);
                    console.log("      TVL:", tvl);
                    console.log("      Overall Risk:", metrics.overallRisk, "/ 10000");
                    console.log("      Whitelisted:", isWhitelisted ? "Yes" : "No");
                    console.log("      Last Updated:", metrics.lastUpdated);
                    
                } catch {
                    console.log("Error getting protocol data:", protocol);
                }
            }
            
        } catch {
            console.log("Error getting protocol list");
        }
        
        console.log("");
    }

    function _getNetworkName() internal view returns (string memory) {
        if (block.chainid == 1) return "Ethereum Mainnet";
        if (block.chainid == 11155111) return "Sepolia Testnet";
        if (block.chainid == 31337) return "Local Anvil";
        return "Unknown Network";
    }
}