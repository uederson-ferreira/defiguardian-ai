// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/RiskGuardian.sol";
import "../test/RiskGuardian.t.sol";

/**
 * @title DeployRiskGuardian
 * @dev Main deployment script for all RiskGuardian contracts
 */
contract DeployRiskGuardian is Script {
    // Deployment addresses will be stored here
    RiskRegistry public riskRegistry;
    PortfolioRiskAnalyzer public portfolioAnalyzer;
    RiskInsurance public riskInsurance;
    
    // Mock price feeds for development
    MockAggregator public ethPriceFeed;
    MockAggregator public btcPriceFeed;
    MockAggregator public usdcPriceFeed;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        console.log(unicode"Deploying RiskGuardian AI Contracts...");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Chain ID:", block.chainid);
        
        // 1. Deploy RiskRegistry
        console.log("\n Deploying RiskRegistry...");
        riskRegistry = new RiskRegistry();
        console.log("RiskRegistry deployed at:", address(riskRegistry));
        
        // 2. Deploy PortfolioRiskAnalyzer
        console.log("\n Deploying PortfolioRiskAnalyzer...");
        portfolioAnalyzer = new PortfolioRiskAnalyzer(address(riskRegistry));
        console.log("PortfolioRiskAnalyzer deployed at:", address(portfolioAnalyzer));
        
        // 3. Deploy RiskInsurance
        console.log("\n Deploying RiskInsurance...");
        riskInsurance = new RiskInsurance(address(portfolioAnalyzer));
        console.log("RiskInsurance deployed at:", address(riskInsurance));
        
        // 4. Deploy Mock Price Feeds (for development)
        if (block.chainid == 31337) { // Anvil local chain
            console.log("\n Deploying Mock Price Feeds for development...");
            
            ethPriceFeed = new MockAggregator(2000e8, 8);   // $2000 ETH
            btcPriceFeed = new MockAggregator(50000e8, 8);  // $50000 BTC
            usdcPriceFeed = new MockAggregator(1e8, 8);     // $1 USDC
            
            console.log("ETH Price Feed deployed at:", address(ethPriceFeed));
            console.log("BTC Price Feed deployed at:", address(btcPriceFeed));
            console.log("USDC Price Feed deployed at:", address(usdcPriceFeed));
            
            // Set price feeds in analyzer
            portfolioAnalyzer.setPriceFeed(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, address(ethPriceFeed));  // WETH
            portfolioAnalyzer.setPriceFeed(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599, address(btcPriceFeed));  // WBTC
            portfolioAnalyzer.setPriceFeed(0xa0B86a33E6411b0fCb8B6E65FA8b6f16b6F7c8a2, address(usdcPriceFeed)); // USDC
        }
        
        // 5. Setup initial configurations
        _setupInitialConfig();
        
        vm.stopBroadcast();
        
        // 6. Log deployment summary
        _logDeploymentSummary();
    }
    
    /**
     * @dev Setup initial configuration for deployed contracts
     */
    function _setupInitialConfig() internal {
        console.log("\n Setting up initial configuration...");
        
        // Register popular DeFi protocols for testing/demo
        _registerDemoProtocols();
        
        // Set initial risk metrics
        _setInitialRiskMetrics();
        
        console.log("Initial configuration complete");
    }
    
    /**
     * @dev Register demo protocols for testing
     */
    function _registerDemoProtocols() internal {
        console.log("Registering demo protocols...");
        
        // Uniswap V3
        riskRegistry.registerProtocol(
            0x1F98431c8aD98523631AE4a59f267346ea31F984, // Uniswap V3 Factory
            "Uniswap V3",
            "dex"
        );
        
        // Aave V3
        riskRegistry.registerProtocol(
            0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2, // Aave V3 Pool
            "Aave V3",
            "lending"
        );
        
        // Compound V3
        riskRegistry.registerProtocol(
            0xc3d688B66703497DAA19211EEdff47f25384cdc3, // Compound V3 USDC
            "Compound V3",
            "lending"
        );
        
        // Lido
        riskRegistry.registerProtocol(
            0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84, // Lido stETH
            "Lido",
            "staking"
        );
        
        // Curve Finance
        riskRegistry.registerProtocol(
            0xD51a44d3FaE010294C616388b506AcdA1bfAAE46, // Curve Registry
            "Curve Finance",
            "dex"
        );
        
        console.log("Demo protocols registered");
    }
    
    /**
     * @dev Set initial risk metrics for demo protocols
     */
    function _setInitialRiskMetrics() internal {
        console.log("Setting initial risk metrics...");
        
        // Uniswap V3 - Medium-high risk (DEX with high volume)
        riskRegistry.updateRiskMetrics(
            0x1F98431c8aD98523631AE4a59f267346ea31F984,
            6000, // volatility
            8000, // liquidity
            4000, // smart contract
            6000  // governance
        );
        
        // Aave V3 - Low-medium risk (established lending protocol)
        riskRegistry.updateRiskMetrics(
            0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2,
            3000, // volatility
            9000, // liquidity
            2000, // smart contract
            4000  // governance
        );
        
        // Compound V3 - Low-medium risk
        riskRegistry.updateRiskMetrics(
            0xc3d688B66703497DAA19211EEdff47f25384cdc3,
            3500, // volatility
            8500, // liquidity
            2500, // smart contract
            4500  // governance
        );
        
        // Lido - Medium risk (staking derivative)
        riskRegistry.updateRiskMetrics(
            0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84,
            4000, // volatility
            7000, // liquidity
            3000, // smart contract
            5000  // governance
        );
        
        // Curve Finance - Medium risk
        riskRegistry.updateRiskMetrics(
            0xD51a44d3FaE010294C616388b506AcdA1bfAAE46,
            5000, // volatility
            7500, // liquidity
            3500, // smart contract
            5500  // governance
        );
        
        console.log("Initial risk metrics set");
    }
    
    /**
     * @dev Log deployment summary
     */
    function _logDeploymentSummary() internal view {
        console.log("\nDEPLOYMENT COMPLETE!");
        console.log("=====================================");
        console.log("RiskRegistry:        ", address(riskRegistry));
        console.log("PortfolioAnalyzer:    ", address(portfolioAnalyzer));
        console.log("RiskInsurance:        ", address(riskInsurance));
        
        if (block.chainid == 31337) {
            console.log("\n Mock Price Feeds:");
            console.log("ETH/USD:  ", address(ethPriceFeed));
            console.log("BTC/USD:  ", address(btcPriceFeed));
            console.log("USDC/USD: ", address(usdcPriceFeed));
        }
        
        console.log("\n Registered Protocols: 5");
        console.log("Ready for integration with frontend and backend!");
        console.log("=====================================");
    }
}

/**
 * @title DeployMocks
 * @dev Deploy only mock contracts for testing
 */
contract DeployMocks is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying Mock Contracts for Testing...");
        
        // Deploy mock price feeds with realistic prices
        MockAggregator ethFeed = new MockAggregator(2000e8, 8);
        MockAggregator btcFeed = new MockAggregator(50000e8, 8);
        MockAggregator usdcFeed = new MockAggregator(1e8, 8);
        MockAggregator usdtFeed = new MockAggregator(1e8, 8);
        MockAggregator daiFeed = new MockAggregator(1e8, 8);
        
        vm.stopBroadcast();
        
        console.log("Mock Price Feeds Deployed:");
        console.log("ETH/USD:  ", address(ethFeed));
        console.log("BTC/USD:  ", address(btcFeed));
        console.log("USDC/USD: ", address(usdcFeed));
        console.log("USDT/USD: ", address(usdtFeed));
        console.log("DAI/USD:  ", address(daiFeed));
    }
}

/**
 * @title UpgradeRiskMetrics
 * @dev Script to update risk metrics for protocols
 */
contract UpgradeRiskMetrics is Script {
    RiskRegistry constant RISK_REGISTRY = RiskRegistry(address(0)); // Update with deployed address
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Updating Risk Metrics...");
        
        // Example: Update Uniswap risk due to market conditions
        RISK_REGISTRY.updateRiskMetrics(
            0x1F98431c8aD98523631AE4a59f267346ea31F984,
            7000, // Increased volatility
            8000, // Maintained liquidity
            4000, // Same smart contract risk
            6000  // Same governance
        );
        
        vm.stopBroadcast();
        
        console.log("Risk metrics updated");
    }
}

/**
 * @title EmergencyPause
 * @dev Emergency script to pause all contracts
 */
contract EmergencyPause is Script {
    RiskRegistry constant RISK_REGISTRY = RiskRegistry(address(0)); // Update addresses
    RiskInsurance constant RISK_INSURANCE = RiskInsurance(address(0)); // Update with deployed address
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("EMERGENCY PAUSE ACTIVATED");
        
        // Pause all pausable contracts
        RISK_REGISTRY.pause();
        RISK_INSURANCE.pause();
        
        vm.stopBroadcast();
        
        console.log("All contracts paused successfully");
    }
}

/**
 * @title SetupPriceFeeds
 * @dev Script to setup Chainlink price feeds on mainnet
 */
contract SetupPriceFeeds is Script {
    PortfolioRiskAnalyzer constant PORTFOLIO_ANALYZER = PortfolioRiskAnalyzer(0x0000000000000000000000000000000000000000);
    
    // Mainnet Chainlink price feed addresses
    address constant ETH_USD_FEED = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
    address constant BTC_USD_FEED = 0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c;
    address constant USDC_USD_FEED = 0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6;
    address constant USDT_USD_FEED = 0x3E7d1eAB13ad0104d2750B8863b489D65364e32D;
    address constant DAI_USD_FEED = 0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9;
    
    // Token addresses
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address constant USDC = 0xa0B86a33E6411b0fCb8B6E65FA8b6f16b6F7c8a2;
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Setting up Chainlink Price Feeds...");
        
        // Set price feeds for major tokens
        PORTFOLIO_ANALYZER.setPriceFeed(WETH, ETH_USD_FEED);
        PORTFOLIO_ANALYZER.setPriceFeed(WBTC, BTC_USD_FEED);
        PORTFOLIO_ANALYZER.setPriceFeed(USDC, USDC_USD_FEED);
        PORTFOLIO_ANALYZER.setPriceFeed(USDT, USDT_USD_FEED);
        PORTFOLIO_ANALYZER.setPriceFeed(DAI, DAI_USD_FEED);
        
        vm.stopBroadcast();
        
        console.log("Price feeds configured for mainnet");
    }
}

/**
 * @title TestLocalDeployment
 * @dev Script to test local deployment with sample data
 */
contract TestLocalDeployment is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get deployed contract addresses (you'll need to update these)
        //RiskRegistry riskRegistry = RiskRegistry(0x0000000000000000000000000000000000000000); // Update with actual address
        PortfolioRiskAnalyzer portfolioAnalyzer = PortfolioRiskAnalyzer(0x0000000000000000000000000000000000000000);
        RiskInsurance riskInsurance = RiskInsurance(0x0000000000000000000000000000000000000000);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Testing Local Deployment...");
        console.log("Deployer:", deployer);
        
        // Test 1: Add a position
        console.log("\nTesting Portfolio Analysis...");
        address testProtocol = 0x1F98431c8aD98523631AE4a59f267346ea31F984; // Uniswap
        address testToken = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;    // WETH
        
        portfolioAnalyzer.addPosition(testProtocol, testToken, 1e18); // 1 ETH
        
        // Check portfolio analysis
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = portfolioAnalyzer.getPortfolioAnalysis(deployer);
        console.log("Portfolio Value:", analysis.totalValue);
        console.log("Portfolio Risk:", analysis.overallRisk);
        console.log("Diversification Score:", analysis.diversificationScore);
        
        // Test 2: Create insurance policy
        console.log("\nTesting Insurance...");
        uint256 premium = 1e17; // 0.1 ETH premium
        riskInsurance.createPolicy{value: premium}(
            10e18,  // 10 ETH coverage
            5000,   // 50% risk threshold
            30 days // 30 day duration
        );
        
        uint256[] memory policies = riskInsurance.getUserPolicies(deployer);
        console.log("Policies created:", policies.length);
        
        vm.stopBroadcast();
        
        console.log("Local deployment test complete!");
    }
}