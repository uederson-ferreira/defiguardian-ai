// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/core/RiskRegistry.sol";
import "../src/libraries/DataTypes.sol";

/**
 * @title RegisterProtocols
 * @dev Script to register protocols in the RiskRegistry
 */
contract RegisterProtocols is Script {
    // Contract addresses
    address constant RISK_REGISTRY = 0xF404b05B55850cBaC8891c9Db1524Fc1D437124C;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        RiskRegistry registry = RiskRegistry(RISK_REGISTRY);
        
        console.log("=== REGISTERING PROTOCOLS ===");
        
        // Register Uniswap V3 protocol
        registerUniswapV3(registry);
        
        // Register Aave protocol
        registerAave(registry);
        
        // Register Compound protocol
        registerCompound(registry);
        
        vm.stopBroadcast();
        console.log("=== PROTOCOL REGISTRATION COMPLETE ===");
    }
    
    function registerUniswapV3(RiskRegistry registry) internal {
        console.log("Registering Uniswap V3...");
        
        // Uniswap V3 Router address on Avalanche Fuji
        address uniswapV3Router = 0x2626664c2603336E57B271c5C0b26F421741e481;
        
        DataTypes.RiskMetrics memory metrics = DataTypes.RiskMetrics({
            volatilityScore: 3000,      // 30% - Medium volatility
            liquidityScore: 8500,       // 85% - High liquidity
            smartContractScore: 9000,   // 90% - Well audited
            governanceScore: 8000,      // 80% - Decentralized governance
            overallRisk: 4000,          // 40% - Medium-low risk
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        try registry.registerProtocol(
            uniswapV3Router,
            "Uniswap V3",
            "DeFi Exchange"
        ) {
            console.log("SUCCESS: Uniswap V3 registered");
        } catch Error(string memory reason) {
            console.log("FAILED: Uniswap V3 -", reason);
        } catch {
            console.log("FAILED: Uniswap V3 - unknown error");
        }
    }
    
    function registerAave(RiskRegistry registry) internal {
        console.log("Registering Aave...");
        
        // Aave V3 Pool address on Avalanche (using a representative address)
        address aavePool = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
        
        DataTypes.RiskMetrics memory metrics = DataTypes.RiskMetrics({
            volatilityScore: 2500,      // 25% - Low-medium volatility
            liquidityScore: 9000,       // 90% - Very high liquidity
            smartContractScore: 9500,   // 95% - Extensively audited
            governanceScore: 8500,      // 85% - Strong governance
            overallRisk: 3000,          // 30% - Low-medium risk
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        try registry.registerProtocol(
            aavePool,
            "Aave V3",
            "Lending Protocol"
        ) {
            console.log("SUCCESS: Aave registered");
        } catch Error(string memory reason) {
            console.log("FAILED: Aave -", reason);
        } catch {
            console.log("FAILED: Aave - unknown error");
        }
    }
    
    function registerCompound(RiskRegistry registry) internal {
        console.log("Registering Compound...");
        
        // Compound Comptroller address (using a representative address)
        address compoundComptroller = 0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4;
        
        DataTypes.RiskMetrics memory metrics = DataTypes.RiskMetrics({
            volatilityScore: 2800,      // 28% - Low-medium volatility
            liquidityScore: 8000,       // 80% - High liquidity
            smartContractScore: 9200,   // 92% - Well audited
            governanceScore: 7500,      // 75% - Good governance
            overallRisk: 3500,          // 35% - Low-medium risk
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        try registry.registerProtocol(
            compoundComptroller,
            "Compound V3",
            "Lending Protocol"
        ) {
            console.log("SUCCESS: Compound registered");
        } catch Error(string memory reason) {
            console.log("FAILED: Compound -", reason);
        } catch {
            console.log("FAILED: Compound - unknown error");
        }
    }
}