// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";
import "../src/core/RiskRegistry.sol";
import "../src/interfaces/IPortfolioAnalyzer.sol";

contract TestCompleteSystem is Script {
    PortfolioRiskAnalyzer public analyzer;
    RiskRegistry public registry;
    
    // Contract addresses on Avalanche Fuji
    address constant ANALYZER_ADDRESS = 0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192;
    address constant REGISTRY_ADDRESS = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
    
    // Token addresses on Avalanche Fuji
    address constant USDC = 0x5425890298aed601595a70AB815c96711a31Bc65;
    address constant WAVAX = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c;
    address constant WETH = 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;
    
    // Registered protocol address
    address constant UNISWAP_V3 = 0x2626664c2603336E57B271c5C0b26F421741e481;
    
    function run() external {
        vm.startBroadcast();
        
        analyzer = PortfolioRiskAnalyzer(ANALYZER_ADDRESS);
        registry = RiskRegistry(REGISTRY_ADDRESS);
        
        console.log("=== TESTING COMPLETE SYSTEM ===\n");
        
        // Test 1: Check if protocols are registered
        testProtocolRegistration();
        
        // Test 2: Add positions
        testAddPositions();
        
        // Test 3: Calculate portfolio risk
        testPortfolioRisk();
        
        // Test 4: Get portfolio analysis
        testPortfolioAnalysis();
        
        vm.stopBroadcast();
    }
    
    function testProtocolRegistration() internal {
        console.log("--- Testing Protocol Registration ---");
        
        try registry.getProtocol(UNISWAP_V3) returns (DataTypes.Protocol memory protocol) {
            console.log("Protocol Name:", protocol.name);
            console.log("Protocol Category:", protocol.category);
            console.log("Protocol Address:", protocol.protocolAddress);
            console.log("Is Whitelisted:", protocol.isWhitelisted);
            console.log("SUCCESS: Protocol is registered\n");
        } catch {
            console.log("FAILED: Protocol not found\n");
        }
    }
    
    function testAddPositions() internal {
        console.log("--- Testing Add Positions ---");
        
        // Add USDC position
        try analyzer.addPosition(UNISWAP_V3, USDC, 1000 * 10**6) {
            console.log("SUCCESS: Added USDC position (1000 USDC)");
        } catch Error(string memory reason) {
            console.log("FAILED: USDC position -", reason);
        }
        
        // Add WAVAX position
        try analyzer.addPosition(UNISWAP_V3, WAVAX, 10 * 10**18) {
            console.log("SUCCESS: Added WAVAX position (10 WAVAX)");
        } catch Error(string memory reason) {
            console.log("FAILED: WAVAX position -", reason);
        }
        
        // Add WETH position
        try analyzer.addPosition(UNISWAP_V3, WETH, 1 * 10**18) {
            console.log("SUCCESS: Added WETH position (1 WETH)\n");
        } catch Error(string memory reason) {
            console.log("FAILED: WETH position -", reason);
        }
    }
    
    function testPortfolioRisk() internal {
        console.log("--- Testing Portfolio Risk Calculation ---");
        
        try analyzer.calculatePortfolioRisk(msg.sender) returns (uint256 riskScore) {
            console.log("Portfolio Risk Score:", riskScore);
            
            if (riskScore <= 3000) {
                console.log("Risk Level: LOW");
            } else if (riskScore <= 7000) {
                console.log("Risk Level: MEDIUM");
            } else {
                console.log("Risk Level: HIGH");
            }
            
            console.log("SUCCESS: Portfolio risk calculated\n");
        } catch Error(string memory reason) {
            console.log("FAILED: Portfolio risk calculation -", reason);
        }
    }
    
    function testPortfolioAnalysis() internal {
        console.log("--- Testing Portfolio Analysis ---");
        
        try analyzer.getPortfolioAnalysis(msg.sender) returns (IPortfolioAnalyzer.PortfolioAnalysis memory analysis) {
            console.log("Total Portfolio Value (USD):", analysis.totalValue);
            console.log("Overall Risk Score:", analysis.overallRisk);
            console.log("Diversification Score:", analysis.diversificationScore);
            console.log("Timestamp:", analysis.timestamp);
            console.log("Is Valid:", analysis.isValid);
            
            // Determine risk level based on score
            string memory riskLevel;
            if (analysis.overallRisk <= 3000) {
                riskLevel = "LOW";
            } else if (analysis.overallRisk <= 7000) {
                riskLevel = "MEDIUM";
            } else {
                riskLevel = "HIGH";
            }
            console.log("Risk Level:", riskLevel);
            
            console.log("SUCCESS: Portfolio analysis completed\n");
        } catch Error(string memory reason) {
            console.log("FAILED: Portfolio analysis -", reason);
        }
    }
}