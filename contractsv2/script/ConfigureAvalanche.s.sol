// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//script/ConfigureAvalanche.s.sol

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/core/RiskRegistry.sol";
import "../src/hedging/StopLossHedge.sol";
import "../src/hedging/RebalanceHedge.sol";

/**
 * @title ConfigureAvalanche
 * @dev Post-deployment configuration for Avalanche
 */
contract ConfigureAvalanche is Script {
    
    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        
        console.log("=== CONFIGURING RISKGUARDIAN FOR AVALANCHE ===");
        console.log("Deployer:", deployer);
        console.log("");
        
        vm.startBroadcast(deployer);
        
        // Load deployed contracts
        //RiskRegistry riskRegistry = RiskRegistry(vm.envAddress("RISK_REGISTRY_ADDRESS"));
        StopLossHedge stopLossHedge = StopLossHedge(vm.envAddress("STOP_LOSS_HEDGE_ADDRESS"));
        RebalanceHedge rebalanceHedge = RebalanceHedge(vm.envAddress("REBALANCE_HEDGE_ADDRESS"));
        
        // Configure tokens for StopLoss
        console.log("Configuring StopLoss for Avalanche tokens...");
        
        // WAVAX
        stopLossHedge.configureToken(
            0xd00ae08403B9bbb9124bB305C09058E32C39A48c, // WAVAX
            0x5498BB86BC934c8D34FDA08E81D444153d0D06aD, // AVAX/USD feed
            0.01 ether // Min 0.01 AVAX
        );
        
        // WETH.e
        stopLossHedge.configureToken(
            0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB, // WETH.e
            0x86d67c3D38D2bCeE722E601025C25a575021c6EA, // ETH/USD feed
            0.001 ether // Min 0.001 ETH
        );
        
        // Configure tokens for Rebalance
        console.log("Configuring Rebalance for Avalanche tokens...");
        
        rebalanceHedge.addSupportedToken(
            0xd00ae08403B9bbb9124bB305C09058E32C39A48c, // WAVAX
            0x5498BB86BC934c8D34FDA08E81D444153d0D06aD, // AVAX/USD feed
            18 // WAVAX decimals
        );
        
        rebalanceHedge.addSupportedToken(
            0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB, // WETH.e
            0x86d67c3D38D2bCeE722E601025C25a575021c6EA, // ETH/USD feed
            18 // WETH.e decimals
        );
        
        vm.stopBroadcast();
        
        console.log("=== AVALANCHE CONFIGURATION COMPLETED ===");
        console.log("System ready for Avalanche operations!");
    }
}
