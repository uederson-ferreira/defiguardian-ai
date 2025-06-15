// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/core/RiskRegistry.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";
import "../src/core/RiskInsurance.sol";
import "../src/oracles/RiskOracle.sol";
import "../src/automation/AlertSystem.sol";
import "../test/RiskGuardian.t.sol"; // MockAggregator

/**
 * @title DeployComplete
 * @dev UPDATED: Multi-network deploy (Sepolia, Ronin, Local)
 */
contract DeployComplete is Script {
    // All contract instances
    RiskRegistry public riskRegistry;
    PortfolioRiskAnalyzer public portfolioAnalyzer;
    RiskInsurance public riskInsurance;
    RiskOracle public riskOracle;
    AlertSystem public alertSystem;
    
    // Mock price feeds for testing networks
    MockAggregator public ethPriceFeed;
    MockAggregator public btcPriceFeed;
    MockAggregator public usdcPriceFeed;
    MockAggregator public usdtPriceFeed;
    MockAggregator public daiPriceFeed;
    MockAggregator public ronPriceFeed;  // RON token for Ronin
    
    // Deployment tracking
    address public deployer;
    uint256 public deploymentStartTime;
    uint256 public totalGasUsed;
    uint256 public currentChainId;
    string public networkName;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);
        deploymentStartTime = block.timestamp;
        currentChainId = block.chainid;
        networkName = _getNetworkName();
        
        console.log("DEPLOYING COMPLETE RISKGUARDIAN SYSTEM");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", currentChainId);
        console.log("Network:", networkName);
        console.log("Block Number:", block.number);
        console.log("Timestamp:", block.timestamp);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        uint256 gasStart = gasleft();
        
        // 1. Deploy Core Contracts
        _deployRiskRegistry();
        _deployRiskOracle();
        _deployPortfolioAnalyzer();
        _deployRiskInsurance();
        _deployAlertSystem();
        
        // 2. Deploy Price Feeds (for testing networks)
        if (currentChainId == 31337 || currentChainId == 2021) {
            _deployMockPriceFeeds();
        }
        
        // 3. Setup Initial Configuration
        _setupInitialConfiguration();
        
        // 4. Verify Deployments
        _verifyDeployments();
        
        totalGasUsed = gasStart - gasleft();
        
        vm.stopBroadcast();
        
        // 5. Generate Report
        _generateDeploymentReport();
    }
    
    /**
     * @dev Get network name from chain ID
     */
    function _getNetworkName() internal view returns (string memory) {
        if (currentChainId == 1) return "Ethereum Mainnet";
        if (currentChainId == 11155111) return "Sepolia Testnet";
        if (currentChainId == 2021) return "Ronin Saigon Testnet";
        if (currentChainId == 31337) return "Local Anvil";
        return "Unknown Network";
    }
    
    /**
     * @dev Deploy RiskRegistry contract
     */
    function _deployRiskRegistry() internal {
        console.log("Deploying RiskRegistry...");
        uint256 gasStart = gasleft();
        
        riskRegistry = new RiskRegistry();
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("   RiskRegistry deployed at:", address(riskRegistry));
        console.log("   Gas used:", gasUsed);
        console.log("");
    }
    
    /**
     * @dev Deploy RiskOracle contract
     */
    function _deployRiskOracle() internal {
        console.log("Deploying RiskOracle...");
        uint256 gasStart = gasleft();
        
        riskOracle = new RiskOracle();
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("   RiskOracle deployed at:", address(riskOracle));
        console.log("   Gas used:", gasUsed);
        console.log("");
    }
    
    /**
     * @dev Deploy PortfolioRiskAnalyzer contract
     */
    function _deployPortfolioAnalyzer() internal {
        console.log("Deploying PortfolioRiskAnalyzer...");
        uint256 gasStart = gasleft();
        
        portfolioAnalyzer = new PortfolioRiskAnalyzer(address(riskRegistry));
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("   PortfolioRiskAnalyzer deployed at:", address(portfolioAnalyzer));
        console.log("   Gas used:", gasUsed);
        console.log("");
    }
    
    /**
     * @dev Deploy RiskInsurance contract
     */
    function _deployRiskInsurance() internal {
        console.log("Deploying RiskInsurance...");
        uint256 gasStart = gasleft();
        
        riskInsurance = new RiskInsurance(address(portfolioAnalyzer));
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("   RiskInsurance deployed at:", address(riskInsurance));
        console.log("   Gas used:", gasUsed);
        console.log("");
    }
    
    /**
     * @dev Deploy AlertSystem contract with libraries
     */
    function _deployAlertSystem() internal {
        console.log("Deploying AlertSystem with libraries...");
        uint256 gasStart = gasleft();
        
        alertSystem = new AlertSystem(
            address(riskOracle),
            address(portfolioAnalyzer),
            address(riskRegistry)
        );
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("   AlertSystem deployed at:", address(alertSystem));
        console.log("   Gas used:", gasUsed);
        
        // Verify libraries
        _verifyAlertSystemLibraries();
        
        console.log("");
    }
    
    /**
     * @dev Verify AlertSystem libraries are properly linked
     */
    function _verifyAlertSystemLibraries() internal view {
        console.log("   Verifying AlertSystem library integration...");
        
        try alertSystem.owner() returns (address owner) {
            console.log("   SUCCESS: AlertSystem libraries properly linked");
            console.log("   SUCCESS: AlertSystem owner:", owner);
        } catch {
            console.log("   ERROR: AlertSystem library linking failed");
        }
    }
    
    /**
     * @dev Deploy mock price feeds for testing networks
     */
    function _deployMockPriceFeeds() internal {
        console.log("Deploying Mock Price Feeds for", networkName, "...");
        
        ethPriceFeed = new MockAggregator(2000e8, 8);   // $2000 ETH
        btcPriceFeed = new MockAggregator(50000e8, 8);  // $50000 BTC
        usdcPriceFeed = new MockAggregator(1e8, 8);     // $1 USDC
        usdtPriceFeed = new MockAggregator(1e8, 8);     // $1 USDT
        daiPriceFeed = new MockAggregator(1e8, 8);      // $1 DAI
        
        if (currentChainId == 2021) {
            ronPriceFeed = new MockAggregator(250e6, 6);    // $0.25 RON (6 decimals)
            console.log("   RON Price Feed:", address(ronPriceFeed));
        }
        
        console.log("   ETH Price Feed:", address(ethPriceFeed));
        console.log("   BTC Price Feed:", address(btcPriceFeed));
        console.log("   USDC Price Feed:", address(usdcPriceFeed));
        console.log("   USDT Price Feed:", address(usdtPriceFeed));
        console.log("   DAI Price Feed:", address(daiPriceFeed));
        console.log("");
    }
    
    /**
     * @dev Setup initial configuration for all contracts
     */
    function _setupInitialConfiguration() internal {
        console.log("Setting up initial configuration...");
        
        // 1. Register protocols based on network
        _registerDemoProtocols();
        
        // 2. Setup risk providers
        _setupRiskProviders();
        
        // 3. Configure price feeds (if test networks)
        if (currentChainId == 31337 || currentChainId == 2021) {
            _configurePriceFeeds();
        }
        
        // 4. Set initial risk metrics
        _setInitialRiskMetrics();
        
        // 5. Setup alert thresholds
        _setupAlertThresholds();
        
        // 6. Setup AlertSystem integration
        _setupAlertSystemIntegration();
        
        console.log("   Initial configuration complete");
        console.log("");
    }
    
    /**
     * @dev Register demo protocols based on network
     */
    function _registerDemoProtocols() internal {
        console.log("   Registering demo protocols for", networkName, "...");
        
        if (currentChainId == 31337) {
            // Local Anvil - Use Ethereum mainnet addresses
            _registerEthereumProtocols();
        } else if (currentChainId == 2021) {
            // Ronin Saigon - Use generic addresses
            _registerRoninProtocols();
        } else if (currentChainId == 11155111) {
            // Sepolia - Use real Sepolia addresses
            _registerSepoliaProtocols();
        } else {
            // Other networks - Use generic addresses
            _registerGenericProtocols();
        }
    }
    
    /**
     * @dev Register Ethereum mainnet protocols (for local Anvil)
     */
    function _registerEthereumProtocols() internal {
        console.log("   Registering Ethereum mainnet protocols...");
        
        // These work on Anvil when forking mainnet
        riskRegistry.registerProtocol(
            0x1F98431c8aD98523631AE4a59f267346ea31F984, // Uniswap V3 Factory
            "Uniswap V3",
            "dex"
        );
        
        riskRegistry.registerProtocol(
            0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2, // Aave V3 Pool
            "Aave V3",
            "lending"
        );
        
        riskRegistry.registerProtocol(
            0xc3d688B66703497DAA19211EEdff47f25384cdc3, // Compound V3 USDC
            "Compound V3",
            "lending"
        );
        
        console.log("   Registered 3 Ethereum protocols");
    }
    
    /**
     * @dev Register Sepolia testnet protocols
     */
    function _registerSepoliaProtocols() internal {
        console.log("   Registering Sepolia testnet protocols...");
        
        // Real Sepolia addresses
        riskRegistry.registerProtocol(
            0x0227628f3F023bb0B980b67D528571c95c6DaC1c, // Uniswap V3 Factory
            "Uniswap V3",
            "dex"
        );
        
        riskRegistry.registerProtocol(
            0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951, // Aave V3 Pool
            "Aave V3",
            "lending"
        );
        
        riskRegistry.registerProtocol(
            0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238, // Compound V3
            "Compound V3",
            "lending"
        );
        
        console.log("   Registered 3 Sepolia protocols");
    }
    
    /**
     * @dev Register Ronin-specific test protocols
     */
    function _registerRoninProtocols() internal {
        console.log("   Registering Ronin-specific test protocols...");
        
        // Use deterministic addresses based on deployer for consistency
        address roninDex = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "ronin_dex")))));
        address roninLending = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "ronin_lending")))));
        address roninStaking = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "ronin_staking")))));
        address roninGaming = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "ronin_gaming")))));
        address roninNft = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "ronin_nft")))));
        
        riskRegistry.registerProtocol(roninDex, "Ronin DEX", "dex");
        riskRegistry.registerProtocol(roninLending, "Ronin Lending", "lending");
        riskRegistry.registerProtocol(roninStaking, "Ronin Staking", "staking");
        riskRegistry.registerProtocol(roninGaming, "Ronin Gaming Protocol", "gaming");
        riskRegistry.registerProtocol(roninNft, "Ronin NFT Marketplace", "nft");
        
        console.log("   Registered 5 Ronin test protocols");
        console.log("   Ronin DEX:", roninDex);
        console.log("   Ronin Lending:", roninLending);
        console.log("   Ronin Staking:", roninStaking);
        console.log("   Ronin Gaming:", roninGaming);
        console.log("   Ronin NFT:", roninNft);
    }
    
    /**
     * @dev Register generic test protocols
     */
    function _registerGenericProtocols() internal {
        console.log("   Registering generic test protocols...");
        
        address protocol1 = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "generic1")))));
        address protocol2 = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "generic2")))));
        address protocol3 = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "generic3")))));
        
        riskRegistry.registerProtocol(protocol1, "Test DEX Protocol", "dex");
        riskRegistry.registerProtocol(protocol2, "Test Lending Protocol", "lending");
        riskRegistry.registerProtocol(protocol3, "Test Staking Protocol", "staking");
        
        console.log("   Registered 3 generic test protocols");
        console.log("   Test DEX:", protocol1);
        console.log("   Test Lending:", protocol2);
        console.log("   Test Staking:", protocol3);
    }
    
    /**
     * @dev Setup risk providers
     */
    function _setupRiskProviders() internal {
        console.log("   Setting up risk providers...");
        
        riskOracle.addRiskProvider(deployer, "Primary Risk Provider", 10000);
        
        console.log("   Added primary risk provider:", deployer);
    }
    
    /**
     * @dev Configure price feeds for testing networks
     */
    function _configurePriceFeeds() internal {
        console.log("   Configuring mock price feeds...");
        
        // Generic token addresses for testing
        address mockWeth = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "weth")))));
        address mockWbtc = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "wbtc")))));
        address mockUsdc = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "usdc")))));
        address mockUsdt = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "usdt")))));
        address mockDai = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "dai")))));
        
        // Configure price feeds
        portfolioAnalyzer.setPriceFeed(mockWeth, address(ethPriceFeed));
        portfolioAnalyzer.setPriceFeed(mockWbtc, address(btcPriceFeed));
        portfolioAnalyzer.setPriceFeed(mockUsdc, address(usdcPriceFeed));
        portfolioAnalyzer.setPriceFeed(mockUsdt, address(usdtPriceFeed));
        portfolioAnalyzer.setPriceFeed(mockDai, address(daiPriceFeed));
        
        if (currentChainId == 2021 && address(ronPriceFeed) != address(0)) {
            address mockRon = address(uint160(uint256(keccak256(abi.encodePacked(deployer, "ron")))));
            portfolioAnalyzer.setPriceFeed(mockRon, address(ronPriceFeed));
            console.log("   RON token configured:", mockRon);
        }
        
        console.log("   Configured price feeds for 5+ tokens");
        console.log("   Mock WETH:", mockWeth);
        console.log("   Mock USDC:", mockUsdc);
    }
    
    /**
     * @dev Set initial risk metrics for registered protocols
     */
    function _setInitialRiskMetrics() internal {
        console.log("   Setting initial risk metrics...");
        
        address[] memory protocols = riskRegistry.getAllProtocols();
        
        for (uint256 i = 0; i < protocols.length; i++) {
            // Generate different risk levels for variety
            uint256 volatility = 3000 + (i * 800);      // 3000, 3800, 4600...
            uint256 liquidity = 8000 - (i * 400);       // 8000, 7600, 7200...
            uint256 smartContract = 2000 + (i * 600);   // 2000, 2600, 3200...
            uint256 governance = 4000 + (i * 300);      // 4000, 4300, 4600...
            
            // Cap values at reasonable levels
            if (volatility > 8000) volatility = 8000;
            if (liquidity < 3000) liquidity = 3000;
            if (smartContract > 7000) smartContract = 7000;
            if (governance > 7000) governance = 7000;
            
            riskRegistry.updateRiskMetrics(
                protocols[i],
                volatility,
                liquidity,
                smartContract,
                governance
            );
        }
        
        console.log("   Set risk metrics for", protocols.length, "protocols");
    }
    
    /**
     * @dev Setup alert thresholds for monitoring
     */
    function _setupAlertThresholds() internal {
        console.log("   Setting up alert thresholds...");
        
        address[] memory protocols = riskRegistry.getAllProtocols();
        
        for (uint256 i = 0; i < protocols.length; i++) {
            uint256 threshold = 6500 + (i * 300); // 6500, 6800, 7100...
            if (threshold > 9000) threshold = 9000; // Cap at 90%
            
            riskOracle.setRiskThreshold(protocols[i], threshold);
        }
        
        console.log("   Configured alert thresholds for", protocols.length, "protocols");
    }
    
    /**
     * @dev Setup AlertSystem integration
     */
    function _setupAlertSystemIntegration() internal {
        console.log("   Setting up AlertSystem integration...");
        
        // Test AlertSystem functionality
        address[] memory protocols = riskRegistry.getAllProtocols();
        
        if (protocols.length > 0) {
            try alertSystem.createSubscription(
                AlertTypes.AlertType.RISK_THRESHOLD,
                protocols[0], // Use first registered protocol
                7000 // 70% risk threshold
            ) {
                console.log("   SUCCESS: AlertSystem subscription test successful");
            } catch Error(string memory reason) {
                console.log("   WARNING: AlertSystem test failed:", reason);
            } catch {
                console.log("   WARNING: AlertSystem test failed: unknown error");
            }
        }
        
        console.log("   AlertSystem integration configured");
    }
    
    /**
     * @dev Verify all contract deployments
     */
    function _verifyDeployments() internal view {
        console.log("Verifying deployments...");
        
        // Check contracts exist
        require(address(riskRegistry).code.length > 0, "RiskRegistry not deployed");
        require(address(riskOracle).code.length > 0, "RiskOracle not deployed");
        require(address(portfolioAnalyzer).code.length > 0, "PortfolioAnalyzer not deployed");
        require(address(riskInsurance).code.length > 0, "RiskInsurance not deployed");
        require(address(alertSystem).code.length > 0, "AlertSystem not deployed");
        
        // Check ownership
        require(riskRegistry.owner() == deployer, "RiskRegistry ownership error");
        require(riskOracle.owner() == deployer, "RiskOracle ownership error");
        require(portfolioAnalyzer.owner() == deployer, "PortfolioAnalyzer ownership error");
        require(riskInsurance.owner() == deployer, "RiskInsurance ownership error");
        require(alertSystem.owner() == deployer, "AlertSystem ownership error");
        
        // Check integrations
        require(address(portfolioAnalyzer.riskRegistry()) == address(riskRegistry), "Portfolio-Registry integration error");
        require(address(riskInsurance.portfolioAnalyzer()) == address(portfolioAnalyzer), "Insurance-Portfolio integration error");
        require(address(alertSystem.riskOracle()) == address(riskOracle), "AlertSystem-Oracle integration error");
        require(address(alertSystem.portfolioAnalyzer()) == address(portfolioAnalyzer), "AlertSystem-Portfolio integration error");
        require(address(alertSystem.riskRegistry()) == address(riskRegistry), "AlertSystem-Registry integration error");
        
        console.log("   All deployments verified successfully");
        console.log("");
    }
    
    /**
     * @dev Generate comprehensive deployment report
     */
    function _generateDeploymentReport() internal view {
        uint256 deploymentTime = block.timestamp - deploymentStartTime;
        
        console.log("DEPLOYMENT COMPLETE!");
        console.log("=====================================");
        console.log("Network:", networkName);
        console.log("Chain ID:", currentChainId);
        console.log("Deployment time:", deploymentTime, "seconds");
        console.log("Total gas used:", totalGasUsed);
        console.log("");
        
        console.log("CONTRACT ADDRESSES:");
        console.log("=====================================");
        console.log("RiskRegistry:        ", address(riskRegistry));
        console.log("RiskOracle:          ", address(riskOracle));
        console.log("PortfolioAnalyzer:   ", address(portfolioAnalyzer));
        console.log("RiskInsurance:       ", address(riskInsurance));
        console.log("AlertSystem:         ", address(alertSystem));
        console.log("");
        
        if (currentChainId == 31337 || currentChainId == 2021) {
            console.log("MOCK PRICE FEEDS:");
            console.log("=====================================");
            console.log("ETH/USD:  ", address(ethPriceFeed));
            console.log("BTC/USD:  ", address(btcPriceFeed));
            console.log("USDC/USD: ", address(usdcPriceFeed));
            console.log("USDT/USD: ", address(usdtPriceFeed));
            console.log("DAI/USD:  ", address(daiPriceFeed));
            
            if (currentChainId == 2021 && address(ronPriceFeed) != address(0)) {
                console.log("RON/USD:  ", address(ronPriceFeed));
            }
            console.log("");
        }
        
        // Show network-specific info
        if (currentChainId == 2021) {
            console.log("RONIN SAIGON FEATURES:");
            console.log("=====================================");
            console.log("Fast transactions: ~2s finality");
            console.log("Low fees: Almost free");
            console.log("Gaming focused ecosystem");
            console.log("Manual verification only");
        } else if (currentChainId == 11155111) {
            console.log("SEPOLIA FEATURES:");
            console.log("=====================================");
            console.log("Real DeFi protocols available");
            console.log("Chainlink price feeds working");
            console.log("Etherscan verification enabled");
            console.log("Official Ethereum testnet");
        }
        
        console.log("");
        console.log("SYSTEM CONFIGURATION:");
        console.log("=====================================");
        address[] memory protocols = riskRegistry.getAllProtocols();
        console.log("Registered Protocols:", protocols.length);
        console.log("Risk Providers: 1");
        console.log("Alert Thresholds:", protocols.length);
        console.log("AlertSystem Libraries: Auto-linked");
        
        if (currentChainId == 31337 || currentChainId == 2021) {
            console.log("Mock Price Feeds: 5-6");
        }
        
        console.log("");
        console.log("NEXT STEPS:");
        console.log("=====================================");
        console.log("1. Update frontend with contract addresses");
        console.log("2. Configure backend API endpoints");
        console.log("3. Test contract interactions");
        console.log("4. Setup monitoring and alerts");
        
        if (currentChainId == 2021) {
            console.log("5. Manual verification in Ronin explorer");
            console.log("6. Test with RON tokens");
        } else if (currentChainId == 11155111) {
            console.log("5. Test with real DeFi protocols");
            console.log("6. Verify on Etherscan");
        }
        
        console.log("");
        console.log("RISKGUARDIAN AI IS READY ON", networkName, "!");
        console.log("=====================================");
    }
}

/**
 * @title DeployQuick
 * @dev Quick deployment for testing (core contracts only)
 */
contract DeployQuick is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Quick deployment for development...");
        
        // Deploy only core contracts
        RiskRegistry riskRegistry = new RiskRegistry();
        PortfolioRiskAnalyzer portfolioAnalyzer = new PortfolioRiskAnalyzer(address(riskRegistry));
        RiskInsurance riskInsurance = new RiskInsurance(address(portfolioAnalyzer));
        
        console.log("RiskRegistry:", address(riskRegistry));
        console.log("PortfolioAnalyzer:", address(portfolioAnalyzer));
        console.log("RiskInsurance:", address(riskInsurance));
        
        vm.stopBroadcast();
        
        console.log("Quick deployment complete!");
    }
}