// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//script/DeploySepoliaMocks.s.sol

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/mocks/SepoliaMocks.sol";
import "../src/core/RiskRegistry.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";

/**
 * @title DeploySepoliaMocks
 * @dev ✅ SCRIPT CRÍTICO: Deploy completo para demo na Sepolia
 * @notice Este script resolve o problema de protocolos limitados na Sepolia
 */
contract DeploySepoliaMocks is Script {
    
    SepoliaSetup public sepoliaSetup;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== SEPOLIA MOCK DEPLOYMENT ===");
        console.log("Deployer:", deployer);
        console.log("Network: Sepolia Testnet");
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy SepoliaSetup
        console.log("1. Deploying SepoliaSetup...");
        sepoliaSetup = new SepoliaSetup();
        console.log("SepoliaSetup deployed at:", address(sepoliaSetup));
        
        // 2. Setup all mocks
        console.log("2. Setting up mocks...");
        sepoliaSetup.setupSepoliaMocks();
        console.log("Mocks setup completed!");
        
        // 3. Verificar se RiskRegistry existe (deve ser deployado antes)
        address riskRegistryAddr = vm.envOr("RISK_REGISTRY_ADDRESS", address(0));
        if (riskRegistryAddr != address(0)) {
            console.log("3. Registering mocks in RiskRegistry...");
            sepoliaSetup.registerMocksInRiskRegistry(riskRegistryAddr);
            
            console.log("4. Setting up realistic risk data...");
            sepoliaSetup.setupRealisticRiskData(riskRegistryAddr);
            
            console.log("RiskRegistry integration completed!");
        } else {
            console.log("WARNING: RISK_REGISTRY_ADDRESS not set, skipping integration");
        }
        
        vm.stopBroadcast();
        
        // 4. Print all deployed addresses
        _printMockAddresses();
        
        console.log("=== SEPOLIA MOCK DEPLOYMENT COMPLETED ===");
        console.log("Ready for demo!");
    }
    
    function _printMockAddresses() internal view {
        console.log("");
        console.log("=== MOCK PROTOCOL ADDRESSES ===");
        console.log("Compound V3 (Mock):", sepoliaSetup.getMockProtocol("compound"));
        console.log("Lido stETH (Mock):", sepoliaSetup.getMockProtocol("lido"));
        console.log("Curve Finance (Mock):", sepoliaSetup.getMockProtocol("curve"));
        console.log("Balancer V2 (Mock):", sepoliaSetup.getMockProtocol("balancer"));
        console.log("Yearn Finance (Mock):", sepoliaSetup.getMockProtocol("yearn"));
        
        console.log("");
        console.log("=== MOCK PRICE FEED ADDRESSES ===");
        console.log("WBTC/USD:", sepoliaSetup.getMockPriceFeed("WBTC"));
        console.log("USDT/USD:", sepoliaSetup.getMockPriceFeed("USDT"));
        console.log("AAVE/USD:", sepoliaSetup.getMockPriceFeed("AAVE"));
        console.log("COMP/USD:", sepoliaSetup.getMockPriceFeed("COMP"));
        console.log("CRV/USD:", sepoliaSetup.getMockPriceFeed("CRV"));
        console.log("LDO/USD:", sepoliaSetup.getMockPriceFeed("LDO"));
        console.log("BAL/USD:", sepoliaSetup.getMockPriceFeed("BAL"));
        console.log("YFI/USD:", sepoliaSetup.getMockPriceFeed("YFI"));
        
        console.log("");
        console.log("=== USAGE INSTRUCTIONS ===");
        console.log("1. Copy these addresses to your .env file");
        console.log("2. Use mock protocols for testing portfolio positions");
        console.log("3. Use mock price feeds for tokens not available on Sepolia");
        console.log("4. All mocks have realistic risk data configured");
    }
}

/**
 * @title ConfigureSepoliaPriceFeeds
 * @dev ✅ SCRIPT AUXILIAR: Configurar price feeds no PortfolioAnalyzer
 */
contract ConfigureSepoliaPriceFeeds is Script {
    
    function run() external {
        address portfolioAnalyzerAddr = vm.envAddress("PORTFOLIO_ANALYZER_ADDRESS");
        address sepoliaSetupAddr = vm.envAddress("SEPOLIA_SETUP_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("=== CONFIGURING PRICE FEEDS IN PORTFOLIO ANALYZER ===");
        console.log("PortfolioAnalyzer:", portfolioAnalyzerAddr);
        console.log("SepoliaSetup:", sepoliaSetupAddr);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SepoliaSetup setup = SepoliaSetup(sepoliaSetupAddr);
        PortfolioRiskAnalyzer analyzer = PortfolioRiskAnalyzer(portfolioAnalyzerAddr);
        
        // Configurar price feeds para tokens mock
        console.log("Configuring mock price feeds...");
        
        // WBTC
        analyzer.setPriceFeed(
            0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599, // WBTC mainnet address (placeholder)
            setup.getMockPriceFeed("WBTC")
        );
        
        // USDT
        analyzer.setPriceFeed(
            0xdAC17F958D2ee523a2206206994597C13D831ec7, // USDT mainnet address (placeholder)
            setup.getMockPriceFeed("USDT")
        );
        
        // AAVE
        analyzer.setPriceFeed(
            0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9, // AAVE mainnet address (placeholder)
            setup.getMockPriceFeed("AAVE")
        );
        
        console.log("Price feeds configured successfully!");
        
        vm.stopBroadcast();
        
        console.log("=== PRICE FEED CONFIGURATION COMPLETED ===");
    }
}