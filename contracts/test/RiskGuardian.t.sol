// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/core/RiskRegistry.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";
import "../src/core/RiskInsurance.sol";

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
 * @title RiskRegistryTest
 * @dev Test suite for RiskRegistry contract
 */
contract RiskRegistryTest is Test {
    RiskRegistry public riskRegistry;
    
    address public owner = address(0x1);
    address public assessor1 = address(0x2);
    address public assessor2 = address(0x3);
    address public user = address(0x4);
    
    address public protocol1 = address(0x100);
    address public protocol2 = address(0x200);
    
    function setUp() public {
        vm.startPrank(owner);
        riskRegistry = new RiskRegistry();
        vm.stopPrank();
    }

    function testInitialState() public view {
        assertEq(riskRegistry.owner(), owner);
        assertTrue(riskRegistry.riskAssessors(owner));
        assertFalse(riskRegistry.paused());
    }

    function testRegisterProtocol() public {
        vm.startPrank(owner);
        
        riskRegistry.registerProtocol(protocol1, "Uniswap V3", "dex");
        
        RiskRegistry.Protocol memory protocol = riskRegistry.getProtocol(protocol1);
        assertEq(protocol.name, "Uniswap V3");
        assertEq(protocol.protocolAddress, protocol1);
        assertEq(protocol.category, "dex");
        assertEq(protocol.riskMetrics.overallRisk, 5000); // Default medium risk
        assertTrue(protocol.riskMetrics.isActive);
        assertFalse(protocol.isWhitelisted);
        
        address[] memory allProtocols = riskRegistry.getAllProtocols();
        assertEq(allProtocols.length, 1);
        assertEq(allProtocols[0], protocol1);
        
        vm.stopPrank();
    }

    function testRegisterProtocolFailures() public {
        vm.startPrank(owner);
        
        // Test zero address
        vm.expectRevert("Invalid address");
        riskRegistry.registerProtocol(address(0), "Test", "test");
        
        // Test empty name
        vm.expectRevert("Name required");
        riskRegistry.registerProtocol(protocol1, "", "test");
        
        // Register first protocol
        riskRegistry.registerProtocol(protocol1, "Protocol1", "dex");
        
        // Test duplicate name
        vm.expectRevert("Protocol name exists");
        riskRegistry.registerProtocol(protocol2, "Protocol1", "lending");
        
        vm.stopPrank();
    }

    function testOnlyOwnerCanRegisterProtocol() public {
        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        riskRegistry.registerProtocol(protocol1, "Test", "test");
        vm.stopPrank();
    }

    function testUpdateRiskMetrics() public {
        // Setup: Register protocol first
        vm.startPrank(owner);
        riskRegistry.registerProtocol(protocol1, "TestProtocol", "lending");
        vm.stopPrank();

        // Test: Update risk metrics as owner
        vm.startPrank(owner);
        riskRegistry.updateRiskMetrics(protocol1, 8000, 6000, 4000, 7000);
        
        RiskRegistry.Protocol memory protocol = riskRegistry.getProtocol(protocol1);
        assertEq(protocol.riskMetrics.volatilityScore, 8000);
        assertEq(protocol.riskMetrics.liquidityScore, 6000);
        assertEq(protocol.riskMetrics.smartContractScore, 4000);
        assertEq(protocol.riskMetrics.governanceScore, 7000);
        
        // Check calculated overall risk: (8000*30 + 6000*25 + 4000*25 + 7000*20) / 100 = 6300
        assertEq(protocol.riskMetrics.overallRisk, 6300);
        vm.stopPrank();
    }

    function testUpdateRiskMetricsAsAssessor() public {
        // Setup
        vm.startPrank(owner);
        riskRegistry.registerProtocol(protocol1, "TestProtocol", "lending");
        riskRegistry.addRiskAssessor(assessor1);
        vm.stopPrank();

        // Test: Update as assessor
        vm.startPrank(assessor1);
        riskRegistry.updateRiskMetrics(protocol1, 7000, 7000, 7000, 7000);
        
        RiskRegistry.Protocol memory protocol = riskRegistry.getProtocol(protocol1);
        assertEq(protocol.riskMetrics.overallRisk, 7000);
        vm.stopPrank();
    }

    function testUpdateRiskMetricsFailures() public {
        // Setup
        vm.startPrank(owner);
        riskRegistry.registerProtocol(protocol1, "TestProtocol", "lending");
        vm.stopPrank();

        // Test: Unauthorized user
        vm.startPrank(user);
        vm.expectRevert("Not authorized assessor");
        riskRegistry.updateRiskMetrics(protocol1, 5000, 5000, 5000, 5000);
        vm.stopPrank();

        // Test: Unregistered protocol
        vm.startPrank(owner);
        vm.expectRevert("Protocol not registered");
        riskRegistry.updateRiskMetrics(protocol2, 5000, 5000, 5000, 5000);

        // Test: Invalid scores
        vm.expectRevert("Scores must be <= 10000");
        riskRegistry.updateRiskMetrics(protocol1, 15000, 5000, 5000, 5000);
        vm.stopPrank();
    }

    function testRiskAssessorManagement() public {
        vm.startPrank(owner);
        
        // Add assessor
        riskRegistry.addRiskAssessor(assessor1);
        assertTrue(riskRegistry.riskAssessors(assessor1));
        
        // Remove assessor
        riskRegistry.removeRiskAssessor(assessor1);
        assertFalse(riskRegistry.riskAssessors(assessor1));
        
        vm.stopPrank();
    }

    function testPauseUnpause() public {
        vm.startPrank(owner);
        
        // Register protocol and add assessor
        riskRegistry.registerProtocol(protocol1, "TestProtocol", "lending");
        riskRegistry.addRiskAssessor(assessor1);
        
        // Pause contract
        riskRegistry.pause();
        assertTrue(riskRegistry.paused());
        vm.stopPrank();

        // Test: Should fail when paused
        vm.startPrank(assessor1);
        vm.expectRevert();
        riskRegistry.updateRiskMetrics(protocol1, 5000, 5000, 5000, 5000);
        vm.stopPrank();

        // Unpause
        vm.startPrank(owner);
        riskRegistry.unpause();
        assertFalse(riskRegistry.paused());
        vm.stopPrank();

        // Should work again
        vm.startPrank(assessor1);
        riskRegistry.updateRiskMetrics(protocol1, 5000, 5000, 5000, 5000);
        vm.stopPrank();
    }
}

/**
 * @title PortfolioRiskAnalyzerTest
 * @dev Test suite for PortfolioRiskAnalyzer contract
 */
contract PortfolioRiskAnalyzerTest is Test {
    RiskRegistry public riskRegistry;
    PortfolioRiskAnalyzer public portfolioAnalyzer;
    MockAggregator public ethPriceFeed;
    MockAggregator public btcPriceFeed;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    address public protocol1 = address(0x100); // Low risk protocol
    address public protocol2 = address(0x200); // High risk protocol
    address public protocol3 = address(0x300); // Medium risk protocol
    
    address public constant ETH_TOKEN = address(0x1000);
    address public constant BTC_TOKEN = address(0x2000);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy contracts
        riskRegistry = new RiskRegistry();
        portfolioAnalyzer = new PortfolioRiskAnalyzer(address(riskRegistry));
        
        // Setup price feeds
        ethPriceFeed = new MockAggregator(2000e8, 8); // $2000 ETH
        btcPriceFeed = new MockAggregator(50000e8, 8); // $50000 BTC
        
        portfolioAnalyzer.setPriceFeed(ETH_TOKEN, address(ethPriceFeed));
        portfolioAnalyzer.setPriceFeed(BTC_TOKEN, address(btcPriceFeed));
        
        // Register protocols with different risk levels
        riskRegistry.registerProtocol(protocol1, "LowRiskProtocol", "lending");
        riskRegistry.registerProtocol(protocol2, "HighRiskProtocol", "dex");
        riskRegistry.registerProtocol(protocol3, "MediumRiskProtocol", "staking");
        
        // Set risk metrics
        riskRegistry.updateRiskMetrics(protocol1, 2000, 2000, 2000, 2000); // Low risk: 2000
        riskRegistry.updateRiskMetrics(protocol2, 8000, 8000, 8000, 8000); // High risk: 8000
        riskRegistry.updateRiskMetrics(protocol3, 5000, 5000, 5000, 5000); // Medium risk: 5000
        
        vm.stopPrank();
    }

    function testAddPosition() public {
        vm.startPrank(user1);
        
        uint256 amount = 1e18; // 1 ETH
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, amount);
        
        PortfolioRiskAnalyzer.Position[] memory positions = portfolioAnalyzer.getUserPositions(user1);
        assertEq(positions.length, 1);
        assertEq(positions[0].protocol, protocol1);
        assertEq(positions[0].token, ETH_TOKEN);
        assertEq(positions[0].amount, amount);
        assertGt(positions[0].value, 0); // Should have value from price feed
        
        vm.stopPrank();
    }

    function testAddPositionFailures() public {
        vm.startPrank(user1);
        
        // Test zero amount
        vm.expectRevert("Amount must be positive");
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 0);
        
        // Test unregistered protocol
        vm.expectRevert("Protocol not registered");
        portfolioAnalyzer.addPosition(address(0x999), ETH_TOKEN, 1e18);
        
        vm.stopPrank();
    }

    function testRemovePosition() public {
        vm.startPrank(user1);
        
        // Add two positions
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 1e18);
        portfolioAnalyzer.addPosition(protocol2, BTC_TOKEN, 1e8);
        
        PortfolioRiskAnalyzer.Position[] memory positions = portfolioAnalyzer.getUserPositions(user1);
        assertEq(positions.length, 2);
        
        // Remove first position
        portfolioAnalyzer.removePosition(0);
        
        positions = portfolioAnalyzer.getUserPositions(user1);
        assertEq(positions.length, 1);
        assertEq(positions[0].token, BTC_TOKEN); // Second position should remain
        
        vm.stopPrank();
    }

    function testRemovePositionFailure() public {
        vm.startPrank(user1);
        
        // Test invalid index
        vm.expectRevert("Invalid position index");
        portfolioAnalyzer.removePosition(0);
        
        vm.stopPrank();
    }

    function testCalculatePortfolioRisk() public {
        vm.startPrank(user1);
        
        // Add positions with different risk levels
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 1e18);  // Low risk
        portfolioAnalyzer.addPosition(protocol2, ETH_TOKEN, 1e18);  // High risk
        
        uint256 portfolioRisk = portfolioAnalyzer.calculatePortfolioRisk(user1);
        
        // Expected: (2000 + 8000) / 2 = 5000, minus diversification bonus
        assertGt(portfolioRisk, 0);
        assertLt(portfolioRisk, 5000); // Should be less than average due to diversification
        
        vm.stopPrank();
    }

    function testPortfolioAnalysisUpdate() public {
        vm.startPrank(user1);
        
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 1e18);
        
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = portfolioAnalyzer.getPortfolioAnalysis(user1);
        
        assertTrue(analysis.isValid);
        assertGt(analysis.totalValue, 0);
        assertGt(analysis.overallRisk, 0);
        assertEq(analysis.diversificationScore, 0); // Single position = no diversification
        
        vm.stopPrank();
    }

    function testDiversificationScoring() public {
        vm.startPrank(user1);
        
        // Add multiple positions across different protocols and categories
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 1e18);  // lending
        portfolioAnalyzer.addPosition(protocol2, ETH_TOKEN, 1e18);  // dex
        portfolioAnalyzer.addPosition(protocol3, ETH_TOKEN, 1e18);  // staking
        
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = portfolioAnalyzer.getPortfolioAnalysis(user1);
        
        assertGt(analysis.diversificationScore, 0); // Should have diversification score
        assertLt(analysis.overallRisk, 5000); // Should be less than medium risk due to diversification
        
        vm.stopPrank();
    }

    function testEmptyPortfolioRisk() public view {
        uint256 risk = portfolioAnalyzer.calculatePortfolioRisk(user1);

        assertEq(risk, 0); // Empty portfolio should have zero risk
    }

    function testPriceFeedManagement() public {
        vm.startPrank(owner);
        
        MockAggregator newPriceFeed = new MockAggregator(1000e8, 8);
        portfolioAnalyzer.setPriceFeed(ETH_TOKEN, address(newPriceFeed));
        
        vm.stopPrank();
        
        // Test that new price feed is used
        vm.startPrank(user1);
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 1e18);
        
        PortfolioRiskAnalyzer.Position[] memory positions = portfolioAnalyzer.getUserPositions(user1);
        // Value should reflect new price (approximately 1000 instead of 2000)
        assertLt(positions[0].value, 1500e18); // Should be closer to 1000
        
        vm.stopPrank();
    }

    function testOnlyOwnerCanSetPriceFeed() public {
        vm.startPrank(user1);
        
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        portfolioAnalyzer.setPriceFeed(ETH_TOKEN, address(0x123));
        
        vm.stopPrank();
    }
}

/**
 * @title RiskInsuranceTest
 * @dev Test suite for RiskInsurance contract
 */
contract RiskInsuranceTest is Test {
    RiskRegistry public riskRegistry;
    PortfolioRiskAnalyzer public portfolioAnalyzer;
    RiskInsurance public riskInsurance;
    MockAggregator public ethPriceFeed;
    
    address public owner = address(0x123);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    address public protocol1 = address(0x100); // Low risk
    address public protocol2 = address(0x200); // High risk
    
    address public constant ETH_TOKEN = address(0x1000);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy contracts
        riskRegistry = new RiskRegistry();
        portfolioAnalyzer = new PortfolioRiskAnalyzer(address(riskRegistry));
        riskInsurance = new RiskInsurance(address(portfolioAnalyzer));
        
        // Setup price feed
        ethPriceFeed = new MockAggregator(2000e8, 8);
        portfolioAnalyzer.setPriceFeed(ETH_TOKEN, address(ethPriceFeed));
        
        // Register protocols
        riskRegistry.registerProtocol(protocol1, "LowRiskProtocol", "lending");
        riskRegistry.registerProtocol(protocol2, "HighRiskProtocol", "dex");
        
        // Set risk metrics
        riskRegistry.updateRiskMetrics(protocol1, 3000, 3000, 3000, 3000); // 3000 risk
        riskRegistry.updateRiskMetrics(protocol2, 8000, 8000, 8000, 8000); // 8000 risk
        
        vm.stopPrank();
    }

    function testCreatePolicy() public {
        uint256 coverageAmount = 1000e18; // 1000 ETH coverage
        uint256 riskThreshold = 7000;     // Triggers at 70% risk
        uint256 duration = 30 days;
        
        // Calculate expected premium: 1% base + risk adjustment
        uint256 basePremium = coverageAmount / 100;           // 10 ETH
        uint256 riskAdjustment = (basePremium * riskThreshold) / 10000; // 7 ETH
        uint256 expectedPremium = basePremium + riskAdjustment; // 17 ETH
        
        vm.startPrank(user1);
        vm.deal(user1, 20e18); // Give user enough ETH
        
        riskInsurance.createPolicy{value: expectedPremium}(
            coverageAmount,
            riskThreshold,
            duration
        );
        
        // Check policy was created
        (
            address policyHolder,
            uint256 policyCoverage,
            uint256 policyPremium,
            uint256 policyRiskThreshold,
            ,
            uint256 policyDuration,
            bool policyActive,
            bool policyHasClaimed
        ) = riskInsurance.policies(1);
        assertEq(policyHolder, user1);
        assertEq(policyCoverage, 1000e18);
        assertEq(policyRiskThreshold, 7000);
        assertEq(policyDuration, 30 days);
        assertTrue(policyActive);
        assertFalse(policyHasClaimed);
        assertEq(policyPremium, expectedPremium);
        
        // Check user policies
        uint256[] memory userPolicies = riskInsurance.getUserPolicies(user1);
        assertEq(userPolicies.length, 1);
        assertEq(userPolicies[0], 1);
        
        vm.stopPrank();
    }

    function testCreatePolicyFailures() public {
        vm.startPrank(user1);
        vm.deal(user1, 1e18);
        
        // Test zero coverage
        vm.expectRevert("Coverage amount must be positive");
        riskInsurance.createPolicy{value: 1e18}(0, 5000, 30 days);
        
        // Test high risk threshold
        vm.expectRevert("Risk threshold too high");
        riskInsurance.createPolicy{value: 1e18}(1000e18, 15000, 30 days);
        
        // Test invalid duration
        vm.expectRevert("Invalid duration");
        riskInsurance.createPolicy{value: 1e18}(1000e18, 5000, 12 hours);
        
        vm.expectRevert("Invalid duration");
        riskInsurance.createPolicy{value: 1e18}(1000e18, 5000, 400 days);
        
        // Test insufficient premium
        vm.expectRevert("Insufficient premium payment");
        riskInsurance.createPolicy{value: 1e15}(1000e18, 5000, 30 days);
        
        vm.stopPrank();
    }

    function testSuccessfulClaim() public {
        // Setup: Add funds to insurance pool first
        vm.deal(owner, 2000e18);
        vm.startPrank(owner);
        riskInsurance.addToPool{value: 2000e18}();
        vm.stopPrank();

        // Setup: Create policy
        uint256 coverageAmount = 1000e18;
        uint256 riskThreshold = 6000;
        uint256 duration = 30 days;
        
        vm.startPrank(user1);
        vm.deal(user1, 100e18);
        
        riskInsurance.createPolicy{value: 50e18}(coverageAmount, riskThreshold, duration);
        
        // Create high-risk portfolio to trigger claim
        portfolioAnalyzer.addPosition(protocol2, ETH_TOKEN, 10e18); // High risk position
        
        // Verify portfolio risk is above threshold
        uint256 portfolioRisk = portfolioAnalyzer.calculatePortfolioRisk(user1);
        assertGt(portfolioRisk, riskThreshold);
        
        // Get initial balance
        uint256 initialBalance = user1.balance;
        
        // Claim insurance
        riskInsurance.claimInsurance(1);
        
        // Check claim was processed
        (
            ,
            ,
            ,
            ,
            ,
            ,
            bool policyActive,
            bool policyHasClaimed
        ) = riskInsurance.policies(1); // Get policy details after claim
        assertTrue(policyHasClaimed);
        assertFalse(policyActive);
        
        // Check payout was received
        assertGt(user1.balance, initialBalance);
        
        vm.stopPrank();
    }

    function testClaimFailures() public {
        // Setup: Create policy
        uint256 coverageAmount = 1000e18;
        uint256 riskThreshold = 6000;
        uint256 duration = 30 days;
        
        vm.startPrank(user1);
        vm.deal(user1, 50e18);
        
        riskInsurance.createPolicy{value: 20e18}(coverageAmount, riskThreshold, duration);
        vm.stopPrank();
        
        // Test: Wrong holder
        vm.startPrank(user2);
        vm.expectRevert("Not policy holder");
        riskInsurance.claimInsurance(1);
        vm.stopPrank();
        
        // Test: Risk threshold not exceeded (low risk portfolio)
        vm.startPrank(user1);
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 1e18); // Low risk
        
        vm.expectRevert("Risk threshold not exceeded");
        riskInsurance.claimInsurance(1);
        vm.stopPrank();
        
        // Test: Policy expired
        vm.warp(block.timestamp + duration + 1);
        
        vm.startPrank(user1);
        vm.expectRevert("Policy expired");
        riskInsurance.claimInsurance(1);
        vm.stopPrank();
    }

    function testMultiplePolicies() public {
        vm.startPrank(user1);
        vm.deal(user1, 100e18);
        
        // Create two policies
        riskInsurance.createPolicy{value: 20e18}(1000e18, 6000, 30 days);
        riskInsurance.createPolicy{value: 30e18}(1500e18, 7000, 60 days);
        
        uint256[] memory userPolicies = riskInsurance.getUserPolicies(user1);
        assertEq(userPolicies.length, 2);
        assertEq(userPolicies[0], 1);
        assertEq(userPolicies[1], 2);
        
        vm.stopPrank();
    }

    function testAddToPool() public {
        uint256 initialPool = riskInsurance.insurancePool();
        
        vm.deal(user1, 10e18);
        vm.startPrank(user1);
        
        riskInsurance.addToPool{value: 5e18}();
        
        assertEq(riskInsurance.insurancePool(), initialPool + 5e18);
        
        vm.stopPrank();
    }

    function testWithdrawExcess() public {
        // Setup: Add MASSIVE pool to overcome any residual claims
        vm.startPrank(user1);
        vm.deal(user1, 1000000e18); // 1 milhão de ETH
        riskInsurance.addToPool{value: 500000e18}(); // 500k ETH no pool
        vm.stopPrank();
        
        // Add even more funds with user2
        vm.startPrank(user2);
        vm.deal(user2, 1000000e18);
        riskInsurance.addToPool{value: 500000e18}(); // Mais 500k ETH
        vm.stopPrank();
        
        // Get balances before withdrawal
        uint256 poolBefore = riskInsurance.insurancePool();
        uint256 ownerBalanceBefore = owner.balance;
        
        // Withdraw tiny amount as owner
        vm.startPrank(owner);
        uint256 withdrawAmount = 1e15; // 0.001 ETH (muito pequeno)
        riskInsurance.withdrawExcess(withdrawAmount);
        vm.stopPrank();
        
        // Verify withdrawal worked
        assertEq(riskInsurance.insurancePool(), poolBefore - withdrawAmount);
        assertEq(owner.balance, ownerBalanceBefore + withdrawAmount);
    }

    function testWithdrawExcessFailures() public {
        vm.startPrank(owner);
        
        uint256 currentPool = riskInsurance.insurancePool();
        
        // Test: Withdraw more than pool
        vm.expectRevert("Cannot withdraw more than pool");
        riskInsurance.withdrawExcess(currentPool + 1e18);
        
        vm.stopPrank();
    }

    function testPauseUnpause() public {
        vm.startPrank(owner);
        
        // Pause
        riskInsurance.pause();
        assertTrue(riskInsurance.paused());
        
        vm.stopPrank();
        
        // Test: Should fail when paused
        vm.startPrank(user1);
        vm.deal(user1, 10000e18); // ETH gigante
        
        vm.expectRevert(); // Deve falhar por estar pausado
        riskInsurance.createPolicy{value: 1000e18}(1000e18, 5000, 30 days); // Premium gigante
        
        vm.stopPrank();
        
        // Unpause
        vm.startPrank(owner);
        riskInsurance.unpause();
        assertFalse(riskInsurance.paused());
        vm.stopPrank();
        
        // Should work again (com premium correto)
        vm.startPrank(user1);
        riskInsurance.createPolicy{value: 20e18}(1000e18, 5000, 30 days); // Premium mais realista
        vm.stopPrank();
    }

    function testPremiumRefund() public {
        uint256 coverageAmount = 1000e18;
        uint256 riskThreshold = 5000;
        uint256 duration = 30 days;
        
        // Calculate actual premium needed
        uint256 basePremium = coverageAmount / 100;
        uint256 riskAdjustment = (basePremium * riskThreshold) / 10000;
        uint256 actualPremium = basePremium + riskAdjustment;
        
        uint256 overpayment = 5e18;
        uint256 totalSent = actualPremium + overpayment;
        
        vm.startPrank(user1);
        vm.deal(user1, totalSent + 1e18); // Extra for gas
        
        uint256 balanceBefore = user1.balance;
        
        riskInsurance.createPolicy{value: totalSent}(
            coverageAmount,
            riskThreshold,
            duration
        );
        
        uint256 balanceAfter = user1.balance;
        
        // Should only charge actual premium, refund the rest
        assertEq(balanceBefore - balanceAfter, actualPremium);
        
        vm.stopPrank();
    }
}

/**
 * @title IntegrationTest
 * @dev Integration tests for all contracts working together
 */
contract IntegrationTest is Test {
    RiskRegistry public riskRegistry;
    PortfolioRiskAnalyzer public portfolioAnalyzer;
    RiskInsurance public riskInsurance;
    MockAggregator public ethPriceFeed;
    
    //address public owner = address(0x1);
    address public owner = address(0x123);
    address public assessor = address(0x2);
    address public trader = address(0x3);
    
    address public uniswap = address(0x100);
    address public aave = address(0x200);
    address public compound = address(0x300);
    
    address public constant ETH_TOKEN = address(0x1000);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy all contracts
        riskRegistry = new RiskRegistry();
        portfolioAnalyzer = new PortfolioRiskAnalyzer(address(riskRegistry));
        riskInsurance = new RiskInsurance(address(portfolioAnalyzer));
        
        // Setup price feed
        ethPriceFeed = new MockAggregator(2000e8, 8);
        portfolioAnalyzer.setPriceFeed(ETH_TOKEN, address(ethPriceFeed));
        
        // Add risk assessor
        riskRegistry.addRiskAssessor(assessor);
        
        // Register popular DeFi protocols
        riskRegistry.registerProtocol(uniswap, "Uniswap V3", "dex");
        riskRegistry.registerProtocol(aave, "Aave", "lending");
        riskRegistry.registerProtocol(compound, "Compound", "lending");
        
        vm.stopPrank();
        
        // Set realistic risk metrics
        vm.startPrank(assessor);
        riskRegistry.updateRiskMetrics(uniswap, 6000, 7000, 4000, 5000);   // Medium-high risk DEX
        riskRegistry.updateRiskMetrics(aave, 3000, 8000, 2000, 4000);      // Lower risk, good liquidity
        riskRegistry.updateRiskMetrics(compound, 3500, 7500, 2500, 4500);  // Slightly higher risk
        vm.stopPrank();
    }

    function testFullWorkflow() public {
        // Setup: Add funds to insurance pool first
        vm.deal(owner, 6000e18);
        vm.startPrank(owner);
        riskInsurance.addToPool{value: 6000e18}();
        vm.stopPrank();

        vm.startPrank(trader);
        vm.deal(trader, 100e18);
        
        // 1. Build a diversified portfolio
        portfolioAnalyzer.addPosition(aave, ETH_TOKEN, 5e18);      // 5 ETH in Aave
        portfolioAnalyzer.addPosition(compound, ETH_TOKEN, 3e18);  // 3 ETH in Compound
        portfolioAnalyzer.addPosition(uniswap, ETH_TOKEN, 2e18);   // 2 ETH in Uniswap
        
        // 2. Check portfolio analysis
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = portfolioAnalyzer.getPortfolioAnalysis(trader);
        assertTrue(analysis.isValid);
        assertGt(analysis.totalValue, 0);
        assertGt(analysis.diversificationScore, 0); // Should have diversification
        
        console.log("Portfolio Value:", analysis.totalValue);
        console.log("Portfolio Risk:", analysis.overallRisk);
        console.log("Diversification Score:", analysis.diversificationScore);
        
        // 3. Get insurance for high-risk threshold
        uint256 coverageAmount = 5000e18;  // 5000 ETH coverage
        uint256 riskThreshold = 4000;      // Trigger at 40% risk
        
        uint256 premium = (coverageAmount / 100) + ((coverageAmount / 100) * riskThreshold / 10000);
        riskInsurance.createPolicy{value: premium}(coverageAmount, riskThreshold, 30 days);
        
        // 4. Simulate market crash - increase all risk scores
        vm.stopPrank();
        vm.startPrank(assessor);
        
        riskRegistry.updateRiskMetrics(uniswap, 9000, 5000, 6000, 7000);   // High volatility
        riskRegistry.updateRiskMetrics(aave, 7000, 4000, 3000, 6000);      // Increased risk
        riskRegistry.updateRiskMetrics(compound, 7500, 4500, 3500, 6500);  // Increased risk
        
        vm.stopPrank();
        vm.startPrank(trader);
        
        // 5. Check updated portfolio risk
        uint256 newRisk = portfolioAnalyzer.calculatePortfolioRisk(trader);
        console.log("New Portfolio Risk after crash:", newRisk);
        
        // 6. If risk exceeded threshold, claim insurance
        if (newRisk >= riskThreshold) {
            uint256 balanceBefore = trader.balance;
            riskInsurance.claimInsurance(1);
            uint256 balanceAfter = trader.balance;
            
            console.log("Insurance payout:", balanceAfter - balanceBefore);
            assertGt(balanceAfter, balanceBefore);
        }
        
        vm.stopPrank();
    }

    function testRiskScoreAccuracy() public {
        vm.startPrank(trader);
        
        // Add single position to test risk calculation
        portfolioAnalyzer.addPosition(aave, ETH_TOKEN, 1e18);
        
        uint256 portfolioRisk = portfolioAnalyzer.calculatePortfolioRisk(trader);
        RiskRegistry.Protocol memory protocol = riskRegistry.getProtocol(aave);
        
        // Portfolio risk should be close to protocol risk (single position, no diversification)
        uint256 protocolRisk = protocol.riskMetrics.overallRisk;
        assertApproxEqRel(portfolioRisk, protocolRisk, 0.1e18); // Within 10%
        
        vm.stopPrank();
    }

    function testDiversificationEffect() public {
        vm.startPrank(trader);
        
        // Test 1: Single position
        portfolioAnalyzer.addPosition(uniswap, ETH_TOKEN, 1e18);
        uint256 singlePositionRisk = portfolioAnalyzer.calculatePortfolioRisk(trader);
        
        // Test 2: Add diversified positions
        portfolioAnalyzer.addPosition(aave, ETH_TOKEN, 1e18);     // Different category
        portfolioAnalyzer.addPosition(compound, ETH_TOKEN, 1e18); // Same category, different protocol
        
        uint256 diversifiedRisk = portfolioAnalyzer.calculatePortfolioRisk(trader);
        
        // Diversified portfolio should have lower risk
        assertLt(diversifiedRisk, singlePositionRisk);
        
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = portfolioAnalyzer.getPortfolioAnalysis(trader);
        assertGt(analysis.diversificationScore, 0);
        
        console.log("Single Position Risk:", singlePositionRisk);
        console.log("Diversified Risk:", diversifiedRisk);
        console.log("Diversification Score:", analysis.diversificationScore);
        
        vm.stopPrank();
    }

    function testEmergencyScenario() public {
        // Setup: Add funds to insurance pool first
        vm.deal(owner, 3000e18);
        vm.startPrank(owner);
        riskInsurance.addToPool{value: 3000e18}();
        vm.stopPrank();

        vm.startPrank(trader);
        vm.deal(trader, 50e18);
        
        // Setup portfolio and insurance
        portfolioAnalyzer.addPosition(aave, ETH_TOKEN, 5e18);
        riskInsurance.createPolicy{value: 30e18}(2000e18, 3000, 30 days);
        
        vm.stopPrank();
        
        // Emergency: Protocol gets hacked, risk assessor updates to maximum risk
        vm.startPrank(assessor);
        riskRegistry.updateRiskMetrics(aave, 10000, 1000, 9000, 8000); // Max risk due to hack
        vm.stopPrank();
        
        // Trader should be able to claim insurance
        vm.startPrank(trader);
        uint256 balanceBefore = trader.balance;
        riskInsurance.claimInsurance(1);
        uint256 balanceAfter = trader.balance;
        
        assertGt(balanceAfter, balanceBefore);
        console.log("Emergency payout:", balanceAfter - balanceBefore);
        
        vm.stopPrank();
    }
}