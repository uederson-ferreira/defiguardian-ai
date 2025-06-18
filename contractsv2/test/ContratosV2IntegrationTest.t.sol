// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";

// Import dos contratos - corrigir caminhos
import "../src/core/RiskRegistry.sol";
import "../src/core/RiskOracle.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";
import "../src/automation/AlertSystem.sol";
import "../src/hedging/StopLossHedge.sol";
import "../src/hedging/RebalanceHedge.sol";
import "../src/automation/RiskGuardianMaster.sol";
import "../src/insurance/RiskInsurance.sol";

/**
 * @title MockAggregator
 * @dev Mock Chainlink price feed for testing
 */
contract MockAggregator {
    int256 public price;
    uint8 public decimals;
    
    constructor(int256 _price, uint8 _decimals) {
        price = _price;
        decimals = _decimals;
    }
    
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, price, block.timestamp, block.timestamp, 1);
    }
    
    function setPrice(int256 _price) external {
        price = _price;
    }
}

/**
 * @title ContratosV2IntegrationTest
 * @dev Complete integration tests for V2 contracts
 */
contract ContratosV2IntegrationTest is Test {
    
    // Contracts
    RiskRegistry public riskRegistry;
    RiskOracle public riskOracle;
    PortfolioRiskAnalyzer public portfolioAnalyzer;
    AlertSystem public alertSystem;
    StopLossHedge public stopLossHedge;
    RebalanceHedge public rebalanceHedge;
    RiskGuardianMaster public riskGuardianMaster;
    RiskInsurance public riskInsurance;

    // Mock aggregators
    MockAggregator public ethPriceFeed;
    MockAggregator public usdcPriceFeed;

    // Test addresses
    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public riskProvider = makeAddr("riskProvider");

    // Mock protocol addresses
    address public constant MOCK_UNISWAP = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address public constant MOCK_AAVE = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    address public constant MOCK_COMPOUND = 0xc3d688B66703497DAA19211EEdff47f25384cdc3;

    // Mock token addresses
    address public constant MOCK_WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant MOCK_USDC = 0xA0B86a33e6441b8c83cC13E5c48A5e4d25eC7e1C;

    function setUp() public {
        vm.startPrank(owner);
        vm.etch(MOCK_UNISWAP, hex"6080604052348015600f57600080fd5b50");
        vm.etch(MOCK_AAVE, hex"6080604052348015600f57600080fd5b50");
        vm.etch(MOCK_COMPOUND, hex"6080604052348015600f57600080fd5b50");
        vm.etch(MOCK_WETH, hex"6080604052348015600f57600080fd5b50");
        vm.etch(MOCK_USDC, hex"6080604052348015600f57600080fd5b50");
        vm.etch(MOCK_COMPOUND, hex"6080604052348015600f57600080fd5b50");

        
        // Deploy all contracts
        _deployContracts();
        
        // Setup mock price feeds
        _setupPriceFeeds();
        
        // Setup initial configuration
        _setupConfiguration();
        
        // Register mock protocols
        _registerMockProtocols();
        
        vm.stopPrank();
        
        // Fund test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function _deployContracts() internal {
        riskRegistry = new RiskRegistry();
        riskOracle = new RiskOracle();
        portfolioAnalyzer = new PortfolioRiskAnalyzer(address(riskRegistry));
        alertSystem = new AlertSystem(
            address(riskOracle),
            address(portfolioAnalyzer),
            address(riskRegistry)
        );
        stopLossHedge = new StopLossHedge();
        rebalanceHedge = new RebalanceHedge();
        riskGuardianMaster = new RiskGuardianMaster();
        riskInsurance = new RiskInsurance(address(portfolioAnalyzer));
    }

    function _setupPriceFeeds() internal {
        // Create mock price feeds
        ethPriceFeed = new MockAggregator(2000e8, 8); // $2000 ETH
        usdcPriceFeed = new MockAggregator(1e8, 8);   // $1 USDC
        
        // Set price feeds in portfolio analyzer
        portfolioAnalyzer.setPriceFeed(MOCK_WETH, address(ethPriceFeed));
        portfolioAnalyzer.setPriceFeed(MOCK_USDC, address(usdcPriceFeed));
    }

    function _setupConfiguration() internal {
        // Add risk assessor
        riskRegistry.addRiskAssessor(owner);
        
        // Add risk provider
        riskOracle.addRiskProvider(owner, "Test Provider", 10000);
        
        // Configure RiskGuardianMaster
        riskGuardianMaster.setHedgeContracts(
            address(stopLossHedge),
            address(rebalanceHedge),
            address(0), // volatilityHedge
            address(0)  // crossChainHedge
        );
    }

    function _registerMockProtocols() internal {
        // Register Uniswap V3
        riskRegistry.registerProtocol(MOCK_UNISWAP, "Uniswap V3", "dex");
        riskRegistry.updateRiskMetrics(MOCK_UNISWAP, 3000, 2000, 1500, 2500);
        
        // Submit risk data to oracle
        riskOracle.submitRiskData(MOCK_UNISWAP, 3000, 2000, 1500, 2500, 2000);
        
        // Register Aave V3
        riskRegistry.registerProtocol(MOCK_AAVE, "Aave V3", "lending");
        riskRegistry.updateRiskMetrics(MOCK_AAVE, 3500, 2500, 2000, 3000);
        
        // Submit risk data to oracle
        riskOracle.submitRiskData(MOCK_AAVE, 3500, 2500, 2000, 3000, 2250);
        
        // Register Compound V3
        riskRegistry.registerProtocol(MOCK_COMPOUND, "Compound V3", "lending");
        riskRegistry.updateRiskMetrics(MOCK_COMPOUND, 3500, 1500, 2500, 4500);
        
        // Submit risk data to oracle
        riskOracle.submitRiskData(MOCK_COMPOUND, 3500, 1500, 2500, 4500, 3000);
    }

    // ========== INTEGRATION TESTS ==========

    function test_FullRiskAnalysisFlow() public {
        console.log("Testing full risk analysis flow...");
        
        vm.startPrank(user1);
        
        // 1. Add positions to portfolio
        portfolioAnalyzer.addPosition(MOCK_UNISWAP, MOCK_WETH, 1 ether);
        portfolioAnalyzer.addPosition(MOCK_AAVE, MOCK_USDC, 5000 * 1e6);
        
        // 2. Get portfolio analysis
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = 
            portfolioAnalyzer.getPortfolioAnalysis(user1);
        
        assertGt(analysis.totalValue, 0, "Portfolio should have value");
        assertGt(analysis.overallRisk, 0, "Portfolio should have risk");
        assertTrue(analysis.isValid, "Analysis should be valid");
        
        // 3. Check individual positions
        PortfolioRiskAnalyzer.Position[] memory positions = 
            portfolioAnalyzer.getUserPositions(user1);
        
        assertEq(positions.length, 2, "Should have 2 positions");
        assertEq(positions[0].protocol, MOCK_UNISWAP, "First position should be Uniswap");
        assertEq(positions[1].protocol, MOCK_AAVE, "Second position should be Aave");
        
        vm.stopPrank();
        
        console.log("Risk analysis flow completed successfully");
    }

    function test_AlertSystemIntegration() public {
        console.log("Testing alert system integration...");
        
        vm.startPrank(user1);
        
        // 1. Create alert subscriptions
        alertSystem.createSubscription(
            AlertTypes.AlertType.RISK_THRESHOLD, // Use AlertTypes instead of AlertSystem
            MOCK_UNISWAP,
            7000 // 70% threshold
        );
        
        // 2. Check subscriptions were created
        AlertTypes.AlertSubscription[] memory subscriptions = 
            alertSystem.getUserSubscriptions(user1);
        
        assertEq(subscriptions.length, 1, "Should have 1 subscription");
        assertEq(uint256(subscriptions[0].alertType), uint256(AlertTypes.AlertType.RISK_THRESHOLD));
        assertEq(subscriptions[0].threshold, 7000, "Threshold should be 70%");
        
        vm.stopPrank();
        
        console.log("Alert system integration completed successfully");
    }

    function test_RiskOracleIntegration() public {
        console.log("Testing risk oracle integration...");
        
        // Test getting aggregated risk data
        try riskOracle.getAggregatedRisk(MOCK_UNISWAP) returns (
            uint256 volatilityRisk,
            uint256 liquidityRisk,
            uint256 /* smartContractRisk */,
            uint256 /* governanceRisk */,
            uint256 /* externalRisk */,
            uint256 overallRisk,
            uint256 /* timestamp */
        ) {
            assertGt(overallRisk, 0, "Should have overall risk");
            assertEq(volatilityRisk, 3000, "Volatility risk should match");
            assertEq(liquidityRisk, 2000, "Liquidity risk should match");
            
            console.log("   Risk data for Uniswap V3:");
            console.log("   Overall Risk:", overallRisk);
            console.log("   Volatility:", volatilityRisk);
            console.log("   Liquidity:", liquidityRisk);
            
        } catch {
            fail();
        }
        
        console.log("Risk oracle integration completed successfully");
    }

    function test_InsuranceIntegration() public {
        console.log("Testing insurance integration...");
        
        // Add funds to insurance pool first
        vm.deal(owner, 1000 ether);
        vm.startPrank(owner);
        riskInsurance.addToPool{value: 500 ether}();
        vm.stopPrank();
        
        vm.startPrank(user1);
        vm.deal(user1, 100 ether);
        
        // 1. Create portfolio with measurable risk
        portfolioAnalyzer.addPosition(MOCK_UNISWAP, MOCK_WETH, 5 ether);
        
        // 2. Create insurance policy
        uint256 coverageAmount = 1000 ether;
        uint256 riskThreshold = 5000; // 50%
        uint256 duration = 30 days;
        
        // Calculate premium
        uint256 basePremium = coverageAmount / 100; // 1%
        uint256 riskAdjustment = (basePremium * riskThreshold) / 10000;
        uint256 premium = basePremium + riskAdjustment;
        
        riskInsurance.createPolicy{value: premium}(
            coverageAmount,
            riskThreshold,
            duration
        );
        
        // 3. Check policy was created
        uint256[] memory userPolicies = riskInsurance.getUserPolicies(user1);
        assertEq(userPolicies.length, 1, "Should have 1 policy");
        
        vm.stopPrank();
        
        console.log("Insurance integration completed successfully");
    }

    function test_EndToEndUserJourney() public {
        console.log("Testing complete end-to-end user journey...");
        
        vm.startPrank(user1);
        
        // 1. User adds portfolio positions
        portfolioAnalyzer.addPosition(MOCK_UNISWAP, MOCK_WETH, 2 ether);
        portfolioAnalyzer.addPosition(MOCK_AAVE, MOCK_USDC, 8000 * 1e6);
        
        // 2. User sets up risk alerts
        alertSystem.createSubscription(
            AlertTypes.AlertType.RISK_THRESHOLD,
            MOCK_UNISWAP,
            6000
        );
        
        // 3. Verify all systems are working
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = 
            portfolioAnalyzer.getPortfolioAnalysis(user1);
        assertTrue(analysis.isValid, "Portfolio analysis should be valid");
        
        // Alert subscriptions
        AlertTypes.AlertSubscription[] memory subscriptions = 
            alertSystem.getUserSubscriptions(user1);
        assertEq(subscriptions.length, 1, "Should have 1 alert subscription");
        
        // Risk data availability
        try riskOracle.getAggregatedRisk(MOCK_UNISWAP) returns (
            uint256, uint256, uint256, uint256, uint256, uint256 overallRisk, uint256
        ) {
            assertGt(overallRisk, 0, "Should have risk data");
        } catch {
            fail();
        }
        
        vm.stopPrank();
        
        console.log("End-to-end user journey completed successfully");
    }

    function test_HedgeSystemIntegration() public {
        console.log("Testing hedge system integration...");
        
        // Test RiskGuardianMaster configuration
        RiskGuardianMaster.AutomationConfig memory config = 
            riskGuardianMaster.getAutomationConfig();
        
        assertTrue(config.stopLossEnabled, "StopLoss should be enabled");
        assertTrue(config.rebalanceEnabled, "Rebalance should be enabled");
        
        // Test updating automation config
        vm.startPrank(owner);
        riskGuardianMaster.updateAutomationConfig(
            true,   // stopLoss
            true,   // rebalance  
            false,  // volatility
            false,  // crossChain
            600,    // 10 min interval
            300000  // 300k gas
        );
        vm.stopPrank();
        
        config = riskGuardianMaster.getAutomationConfig();
        assertEq(config.checkInterval, 600, "Interval should be updated");
        assertEq(config.maxGasPerUpkeep, 300000, "Gas should be updated");
        
        console.log("Hedge system integration completed successfully");
    }

    function test_SystemResilience() public {
        console.log("Testing system resilience...");
        
        vm.startPrank(user1);
        
        // 1. Create normal portfolio
        portfolioAnalyzer.addPosition(MOCK_UNISWAP, MOCK_WETH, 1 ether);
        
        // 2. Test removing non-existent position (should fail gracefully)
        vm.expectRevert("Invalid position index");
        portfolioAnalyzer.removePosition(999);
        
        // 3. Test adding position with unregistered protocol (should fail)
        vm.expectRevert("Protocol not registered");
        portfolioAnalyzer.addPosition(address(0x999), MOCK_WETH, 1 ether);
        
        // 4. Test alert with invalid threshold (should be handled)
        try alertSystem.createSubscription(
            AlertTypes.AlertType.RISK_THRESHOLD,
            MOCK_UNISWAP,
            15000 // Invalid threshold > 10000
        ) {
            fail();
        } catch {
            // Expected to fail
        }
        
        vm.stopPrank();
        
        console.log("System resilience test completed successfully");
    }

    function test_GasEfficiency() public {
        console.log("Testing gas efficiency...");
        
        vm.startPrank(user1);
        
        // Test portfolio operations gas usage
        uint256 gasBefore = gasleft();
        portfolioAnalyzer.addPosition(MOCK_UNISWAP, MOCK_WETH, 1 ether);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("   Gas used for addPosition:", gasUsed);
        assertLt(gasUsed, 300000, "addPosition should be gas efficient");
        
        // Test risk calculation gas usage
        gasBefore = gasleft();
        portfolioAnalyzer.calculatePortfolioRisk(user1);
        gasUsed = gasBefore - gasleft();
        
        console.log("   Gas used for calculatePortfolioRisk:", gasUsed);
        assertLt(gasUsed, 200000, "risk calculation should be gas efficient");
        
        vm.stopPrank();
        
        console.log("Gas efficiency test completed successfully");
    }

    function test_DataConsistency() public {
        console.log("Testing data consistency...");
        
        // Test registry vs oracle data consistency
        RiskRegistry.Protocol memory registryProtocol = riskRegistry.getProtocol(MOCK_UNISWAP);
        
        try riskOracle.getAggregatedRisk(MOCK_UNISWAP) returns (
            uint256 volatilityRisk,
            uint256 liquidityRisk,
            uint256 smartContractRisk,
            uint256 governanceRisk,
            uint256,
            uint256,
            uint256
        ) {
            // Data should be consistent between registry and oracle
            assertEq(volatilityRisk, registryProtocol.riskMetrics.volatilityScore, 
                "Volatility should match between registry and oracle");
            assertEq(liquidityRisk, registryProtocol.riskMetrics.liquidityScore,
                "Liquidity should match between registry and oracle");
            assertEq(smartContractRisk, registryProtocol.riskMetrics.smartContractScore,
                "Smart contract risk should match between registry and oracle");
            assertEq(governanceRisk, registryProtocol.riskMetrics.governanceScore,
                "Governance risk should match between registry and oracle");
                
        } catch {
            fail();
        }
        
        console.log("Data consistency test completed successfully");
    }
}