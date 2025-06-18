// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import of contracts
import "../core/RiskRegistry.sol";
import "../core/RiskOracle.sol";
import "../automation/RiskGuardianMaster.sol";

/**
 * @title UpdateConfigurations
 * @dev Script to update post-deployment configurations
 */
contract UpdateConfigurations is Script {
    
    // Contracts
    RiskRegistry riskRegistry;
    RiskOracle riskOracle;
    RiskGuardianMaster riskGuardianMaster;
    
    uint256 public chainId;
    address public deployer;

    function run() external {
        deployer = vm.envAddress("DEPLOYER_ADDRESS");
        chainId = block.chainid;
        
        console.log("UPDATING CONFIGURATIONS");
        console.log("Network:", _getNetworkName());
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("");

        // Load contracts
    _loadContracts();

        vm.startBroadcast(deployer);

        // Update based on network
        if (chainId == 1) {
            _updateMainnetConfigs();
        } else if (chainId == 11155111) {
            _updateSepoliaConfigs();
        } else if (chainId == 31337) {
            _updateLocalConfigs();
        } else {
            _updateGenericConfigs();
        }

        vm.stopBroadcast();
        
        console.log("CONFIGURATIONS UPDATED!");
    }

    function _loadContracts() internal {
        address registryAddr = vm.envAddress("RISK_REGISTRY_ADDRESS");
        address oracleAddr = vm.envAddress("RISK_ORACLE_ADDRESS");
        address masterAddr = vm.envOr("RISK_GUARDIAN_MASTER_ADDRESS", address(0));
        
        riskRegistry = RiskRegistry(registryAddr);
        riskOracle = RiskOracle(oracleAddr);
        if (masterAddr != address(0)) {
            riskGuardianMaster = RiskGuardianMaster(masterAddr);
        }
        
        console.log("Contracts loaded:");
        console.log("   RiskRegistry:", address(riskRegistry));
        console.log("   RiskOracle:", address(riskOracle));
        if (masterAddr != address(0)) {
            console.log("   RiskGuardianMaster:", address(riskGuardianMaster));
        }
        console.log("");
    }

    /**
     * @dev Configurations for Mainnet (Production)
     */
    function _updateMainnetConfigs() internal {
        console.log("Updating configurations for Mainnet (Production)...");
        
        // 1. More conservative risk thresholds
        console.log("   Updating risk thresholds...");
        
        // Main protocols with conservative thresholds
        address uniswapV3 = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
        address aaveV3 = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
        address compoundV3 = 0xc3d688B66703497DAA19211EEdff47f25384cdc3;
        address lido = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
        address curve = 0xD51a44d3FaE010294C616388b506AcdA1bfAAE46;
        
        // Low thresholds for production
        riskOracle.setRiskThreshold(uniswapV3, 5000);   // 50% - Conservative
          riskOracle.setRiskThreshold(aaveV3, 4500);      // 45% - Very conservative
          riskOracle.setRiskThreshold(compoundV3, 5500);  // 55% - Conservative
          riskOracle.setRiskThreshold(lido, 6000);        // 60% - Moderate
          riskOracle.setRiskThreshold(curve, 6500);       // 65% - Moderate-high
        
        console.log("   Conservative thresholds configured");
        
        // 2. Automation configurations for production
        if (address(riskGuardianMaster) != address(0)) {
            console.log("   Configuring automation for production...");
            
            riskGuardianMaster.updateAutomationConfig(
                true,    // stopLoss enabled
                true,    // rebalance enabled
                true,    // volatility enabled
                true,    // crossChain enabled (if CCIP available)
                600,     // 10 min interval (slower for production)
                300000   // 300k gas (conservative)
            );
            
            console.log("   Automation configured for production");
        }
        
        // 3. Security parameters
        console.log("   Configuring security parameters...");
        
        // Add multiple risk assessors for redundancy
        // (example addresses - replace with real multisig)
        address multisig1 = 0x0000000000000000000000000000000000000001;
        address multisig2 = 0x0000000000000000000000000000000000000002;
        
        try riskRegistry.addRiskAssessor(multisig1) {
            console.log("   Multisig 1 added as risk assessor");
        } catch {
            console.log("   Multisig 1 is already a risk assessor");
        }
        
        try riskRegistry.addRiskAssessor(multisig2) {
            console.log("   Multisig 2 added as risk assessor");
        } catch {
            console.log("   Multisig 2 is already a risk assessor");
        }
        
        console.log("Production configurations applied!");
    }

    /**
     * @dev Configurations for Sepolia (Tests)
     */
    function _updateSepoliaConfigs() internal {
        console.log("Updating configurations for Sepolia (Tests)...");
        
        // 1. Higher thresholds to facilitate testing
        console.log("   Configuring thresholds for tests...");
        
        address uniswapV3 = 0x0227628f3F023bb0B980b67D528571c95c6DaC1c;
        address aaveV3 = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
        
        // High thresholds to facilitate testing
        riskOracle.setRiskThreshold(uniswapV3, 8000);   // 80% - High for tests
          riskOracle.setRiskThreshold(aaveV3, 7500);      // 75% - High for tests
        
        console.log("   Test thresholds configured");
        
        // 2. Automation configurations for tests
        if (address(riskGuardianMaster) != address(0)) {
            console.log("   Configuring automation for tests...");
            
            riskGuardianMaster.updateAutomationConfig(
                true,    // stopLoss enabled
                true,    // rebalance enabled
                true,    // volatility enabled
                true,    // crossChain enabled
                180,     // 3 min interval (faster for tests)
                500000   // 500k gas (more generous for tests)
            );
            
            console.log("   Automation configured for tests");
        }
        
        // 3. Debug configurations
        console.log("   Enabling debug features...");
        
        // Add deployer as risk provider with high weight
        try riskOracle.addRiskProvider(deployer, "Debug Provider", 10000) {
            console.log("   Debug provider added");
        } catch {
            console.log("   Debug provider already exists");
        }
        
        console.log("Test configurations applied!");
    }

    /**
     * @dev Configurations for local development
     */
    function _updateLocalConfigs() internal {
        console.log("Updating configurations for Local (Development)...");
        
        // 1. Low thresholds for easy testing
        console.log("   Configuring thresholds for development...");
        
        // Using mock addresses
        address mockUniswap = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
        address mockAave = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
        address mockCompound = 0xc3d688B66703497DAA19211EEdff47f25384cdc3;
        
        // Low thresholds for easy triggering
        riskOracle.setRiskThreshold(mockUniswap, 3000);     // 30% - Very low
          riskOracle.setRiskThreshold(mockAave, 3500);        // 35% - Very low
          riskOracle.setRiskThreshold(mockCompound, 4000);    // 40% - Low
        
        console.log("   Development thresholds configured");
        
        // 2. Fast automation for development
        if (address(riskGuardianMaster) != address(0)) {
            console.log("   Configuring automation for development...");
            
            riskGuardianMaster.updateAutomationConfig(
                true,    // stopLoss enabled
                true,    // rebalance enabled
                false,   // volatility disabled (may be unstable locally)
                false,   // crossChain disabled (no local CCIP)
                60,      // 1 min interval (very fast for debugging)
                1000000  // 1M gas (generous for debugging)
            );
            
            console.log("   Fast automation configured");
        }
        
        // 3. Development features
        console.log("   Enabling development features...");
        
        // Multiple risk providers for testing
        try riskOracle.addRiskProvider(deployer, "Dev Provider 1", 5000) {
            console.log("   Dev Provider 1 added");
        } catch {
            console.log("   Dev Provider 1 already exists");
        }
        
        // Add test address as risk assessor
        address testAddress = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Anvil #0
        try riskRegistry.addRiskAssessor(testAddress) {
            console.log("   Test address added as risk assessor");
        } catch {
            console.log("   Test address is already a risk assessor");
        }
        
        console.log("Development configurations applied!");
    }

    /**
     * @dev Generic configurations for other networks
     */
    function _updateGenericConfigs() internal {
        console.log("Applying generic configurations...");
        
        // Basic and secure configurations
        if (address(riskGuardianMaster) != address(0)) {
            riskGuardianMaster.updateAutomationConfig(
                true,    // stopLoss enabled
                true,    // rebalance enabled
                true,    // volatility enabled
                false,   // crossChain disabled (may not have CCIP)
                300,     // 5 min interval
                400000   // 400k gas
            );
            
            console.log("   Generic configurations applied");
        }
    }

    function _getNetworkName() internal view returns (string memory) {
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia Testnet";
        if (chainId == 137) return "Polygon Mainnet";
        if (chainId == 42161) return "Arbitrum One";
        if (chainId == 31337) return "Local Anvil";
        return "Unknown Network";
    }
}
