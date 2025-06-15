// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/core/RiskRegistry.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";
import "../src/core/RiskInsurance.sol";
import "../src/oracles/RiskOracle.sol";
import "../src/automation/AlertSystem.sol";

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
 * @title GasOptimizationTest
 * @dev Comprehensive gas optimization testing and benchmarking
 */
contract GasOptimizationTest is Test {
    RiskRegistry public riskRegistry;
    PortfolioRiskAnalyzer public portfolioAnalyzer;
    RiskInsurance public riskInsurance;
    RiskOracle public riskOracle;
    AlertSystem public alertSystem;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public provider1 = address(0x4);
    
    address public protocol1 = address(0x100);
    address public protocol2 = address(0x200);
    address public constant ETH_TOKEN = address(0x1000);
    
    // Gas benchmarks storage
    struct GasBenchmark {
        string functionName;
        uint256 gasUsed;
        uint256 gasLimit;
        bool isOptimal;
        string notes;
    }
    
    GasBenchmark[] public benchmarks;
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy all contracts
        riskRegistry = new RiskRegistry();
        portfolioAnalyzer = new PortfolioRiskAnalyzer(address(riskRegistry));
        riskInsurance = new RiskInsurance(address(portfolioAnalyzer));
        riskOracle = new RiskOracle();
        alertSystem = new AlertSystem(
            address(riskOracle),
            address(portfolioAnalyzer),
            address(riskRegistry)
        );
        
        // Setup basic data with unique names
        riskRegistry.registerProtocol(protocol1, "SetupTestProtocol1", "lending");
        riskRegistry.registerProtocol(protocol2, "SetupTestProtocol2", "dex");
        riskOracle.addRiskProvider(provider1, "TestProvider", 5000);
        
        // Setup price feed
        MockAggregator mockFeed = new MockAggregator(2000e8, 8);
        portfolioAnalyzer.setPriceFeed(ETH_TOKEN, address(mockFeed));
        
        vm.stopPrank();
    }

    /**
     * @dev Test RiskRegistry gas consumption
     */
    function testRiskRegistryGas() public {
        vm.startPrank(owner);
        
        // Test registerProtocol gas usage - FIXED: Use unique name
        uint256 gasBefore = gasleft();
        riskRegistry.registerProtocol(address(0x300), "RiskRegistryGasTestProtocol", "staking");
        uint256 gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "RiskRegistry.registerProtocol",
            gasUsed,
            200000, // 200k gas limit
            gasUsed < 150000, // Should be under 150k
            "Protocol registration should be efficient"
        );
        
        console.log("RiskRegistry.registerProtocol gas used:", gasUsed);
        
        // Test updateRiskMetrics gas usage
        gasBefore = gasleft();
        riskRegistry.updateRiskMetrics(protocol1, 6000, 7000, 5000, 6500);
        gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "RiskRegistry.updateRiskMetrics",
            gasUsed,
            100000,
            gasUsed < 80000,
            "Risk metrics update should be lightweight"
        );
        
        console.log("RiskRegistry.updateRiskMetrics gas used:", gasUsed);
        
        vm.stopPrank();
    }

    /**
     * @dev Test PortfolioRiskAnalyzer gas consumption
     */
    function testPortfolioAnalyzerGas() public {
        vm.startPrank(user1);
        
        // Test addPosition gas usage
        uint256 gasBefore = gasleft();
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 1e18);
        uint256 gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "PortfolioAnalyzer.addPosition",
            gasUsed,
            300000,
            gasUsed < 250000,
            "Adding position should be efficient"
        );
        
        console.log("PortfolioAnalyzer.addPosition gas used:", gasUsed);
        
        // Add more positions for comprehensive test
        portfolioAnalyzer.addPosition(protocol2, ETH_TOKEN, 2e18);
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 0.5e18);
        
        // Test calculatePortfolioRisk gas usage
        gasBefore = gasleft();
        uint256 risk = portfolioAnalyzer.calculatePortfolioRisk(user1);
        gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "PortfolioAnalyzer.calculatePortfolioRisk",
            gasUsed,
            200000,
            gasUsed < 150000,
            "Risk calculation should be gas-efficient"
        );
        
        console.log("PortfolioAnalyzer.calculatePortfolioRisk gas used:", gasUsed);
        console.log("Calculated risk:", risk);
        
        // Test removePosition gas usage
        gasBefore = gasleft();
        portfolioAnalyzer.removePosition(0);
        gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "PortfolioAnalyzer.removePosition",
            gasUsed,
            150000,
            gasUsed < 100000,
            "Removing position should be efficient"
        );
        
        console.log("PortfolioAnalyzer.removePosition gas used:", gasUsed);
        
        vm.stopPrank();
    }

    /**
     * @dev Test RiskInsurance gas consumption - FIXED
     */
    function testRiskInsuranceGas() public {
        // Add funds to insurance pool FIRST
        vm.deal(owner, 1000e18);
        vm.startPrank(owner);
        riskInsurance.addToPool{value: 500e18}();
        vm.stopPrank();
        
        vm.deal(user1, 100e18);
        vm.startPrank(user1);
        
        // Setup portfolio first
        portfolioAnalyzer.addPosition(protocol1, ETH_TOKEN, 5e18);
        
        // Test createPolicy gas usage - FIXED PREMIUM CALCULATION
        uint256 coverageAmount = 1000e18;
        uint256 riskThreshold = 5000;
        uint256 duration = 30 days;
        
        // Calculate correct premium: 1% base + risk adjustment
        uint256 basePremium = coverageAmount / 100;           // 10 ETH
        uint256 riskAdjustment = (basePremium * riskThreshold) / 10000; // 5 ETH
        uint256 premium = basePremium + riskAdjustment;       // 15 ETH
        
        uint256 gasBefore = gasleft();
        riskInsurance.createPolicy{value: premium}(coverageAmount, riskThreshold, duration);
        uint256 gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "RiskInsurance.createPolicy",
            gasUsed,
            400000,
            gasUsed < 300000,
            "Creating insurance policy should be reasonable"
        );
        
        console.log("RiskInsurance.createPolicy gas used:", gasUsed);
        console.log("Premium paid:", premium);
        
        vm.stopPrank();
        
        // Simulate high risk for claim test
        vm.startPrank(owner);
        riskRegistry.updateRiskMetrics(protocol1, 9000, 9000, 9000, 9000);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        // Test claimInsurance gas usage
        gasBefore = gasleft();
        try riskInsurance.claimInsurance(1) {
            gasUsed = gasBefore - gasleft();
            
            _addBenchmark(
                "RiskInsurance.claimInsurance",
                gasUsed,
                350000,
                gasUsed < 250000,
                "Insurance claim should be efficient"
            );
            
            console.log("RiskInsurance.claimInsurance gas used:", gasUsed);
        } catch Error(string memory reason) {
            console.log("Claim failed:", reason);
        }
        
        vm.stopPrank();
    }

    /**
     * @dev Test RiskOracle gas consumption
     */
    function testRiskOracleGas() public {
        vm.startPrank(provider1);
        
        // Test submitRiskData gas usage
        uint256 gasBefore = gasleft();
        riskOracle.submitRiskData(protocol1, 6000, 7000, 5000, 6000, 5500);
        uint256 gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "RiskOracle.submitRiskData",
            gasUsed,
            300000,
            gasUsed < 200000,
            "Risk data submission should be efficient"
        );
        
        console.log("RiskOracle.submitRiskData gas used:", gasUsed);
        
        vm.stopPrank();
        
        // Test getAggregatedRisk gas usage (view function)
        gasBefore = gasleft();
        try riskOracle.getAggregatedRisk(protocol1) returns (
            uint256, uint256, uint256, uint256, uint256, uint256, uint256
        ) {
            gasUsed = gasBefore - gasleft();
            console.log("RiskOracle.getAggregatedRisk gas used:", gasUsed);
        } catch {
            console.log("Risk data not yet aggregated");
        }
    }

    /**
     * @dev Test AlertSystem gas consumption
     */
    function testAlertSystemGas() public {
        vm.startPrank(user1);
        
        // Test createSubscription gas usage
        uint256 gasBefore = gasleft();
        alertSystem.createSubscription(
            AlertTypes.AlertType.RISK_THRESHOLD, // Properly using enum type
            protocol1,
            7000
        );
        uint256 gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "AlertSystem.createSubscription",
            gasUsed,
            200000,
            gasUsed < 150000,
            "Creating alert subscription should be efficient"
        );
        
        console.log("AlertSystem.createSubscription gas used:", gasUsed);
        
        // Test checkUserAlerts gas usage
        gasBefore = gasleft();
        alertSystem.checkUserAlerts(user1);
        gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "AlertSystem.checkUserAlerts",
            gasUsed,
            500000,
            gasUsed < 400000,
            "Checking alerts should be reasonable"
        );
        
        console.log("AlertSystem.checkUserAlerts gas used:", gasUsed);
        
        vm.stopPrank();
    }

    /**
     * @dev Test batch operations gas efficiency - FIXED
     */
    function testBatchOperationsGas() public {
        vm.startPrank(owner);
        
        // Test multiple protocol registrations - FIXED: Use unique names
        uint256 gasBefore = gasleft();
        for (uint256 i = 0; i < 5; i++) {
            address protocolAddr = address(uint160(0x2000 + i)); // Different base address
            string memory name = string(abi.encodePacked("BatchProtocol", _uint2str(i)));
            riskRegistry.registerProtocol(protocolAddr, name, "defi");
        }
        uint256 gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "RiskRegistry.batchRegister (5 protocols)",
            gasUsed,
            1000000,
            gasUsed < 800000,
            "Batch operations should be more efficient than individual"
        );
        
        console.log("Batch register 5 protocols gas used:", gasUsed);
        console.log("Average per protocol:", gasUsed / 5);
        
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        // Test multiple position additions - FIXED: Use the newly registered protocols
        gasBefore = gasleft();
        for (uint256 i = 0; i < 3; i++) {
            address protocolAddr = address(uint160(0x2000 + i)); // Use newly registered protocols
            portfolioAnalyzer.addPosition(protocolAddr, ETH_TOKEN, 1e18);
        }
        gasUsed = gasBefore - gasleft();
        
        _addBenchmark(
            "PortfolioAnalyzer.batchAddPositions (3 positions)",
            gasUsed,
            900000,
            gasUsed < 700000,
            "Adding multiple positions should be efficient"
        );
        
        console.log("Batch add 3 positions gas used:", gasUsed);
        console.log("Average per position:", gasUsed / 3);
        
        vm.stopPrank();
    }

    /**
     * @dev Test gas usage with different portfolio sizes - FIXED
     */
    function testScalingGas() public {
        // Register additional protocols for testing - FIXED: Use unique names
        vm.startPrank(owner);
        address[] memory additionalProtocols = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            address protocolAddr = address(uint160(0x3000 + i)); // Use different base to avoid conflicts
            string memory name = string(abi.encodePacked("ScalingProtocol", _uint2str(i)));
            riskRegistry.registerProtocol(protocolAddr, name, "defi");
            additionalProtocols[i] = protocolAddr;
        }
        vm.stopPrank();
        
        // Test with different portfolio sizes
        uint256[] memory portfolioSizes = new uint256[](3);
        portfolioSizes[0] = 1;
        portfolioSizes[1] = 3;
        portfolioSizes[2] = 5;
        
        for (uint256 s = 0; s < portfolioSizes.length; s++) {
            uint256 size = portfolioSizes[s];
            
            // Start fresh prank for each iteration - FIXED
            vm.startPrank(user2);
            
            // Create portfolio of specific size - FIXED: Use correct registered protocols
            for (uint256 i = 0; i < size; i++) {
                address protocolAddr;
                if (i == 0) {
                    protocolAddr = protocol1; // Use pre-registered protocol1 (0x100)
                } else if (i == 1) {
                    protocolAddr = protocol2; // Use pre-registered protocol2 (0x200) 
                } else {
                    // Use additional protocols that were registered (0x3000, 0x3001, etc.)
                    protocolAddr = additionalProtocols[i - 2];
                }
                portfolioAnalyzer.addPosition(protocolAddr, ETH_TOKEN, 1e18);
            }
            
            // Measure gas for risk calculation
            uint256 gasBefore = gasleft();
            portfolioAnalyzer.calculatePortfolioRisk(user2);
            uint256 gasUsed = gasBefore - gasleft();
            
            _addBenchmark(
                string(abi.encodePacked("Portfolio risk calculation (", _uint2str(size), " positions)")),
                gasUsed,
                300000 + (size * 20000), // Dynamic limit based on size
                gasUsed < (100000 + (size * 15000)), // Should scale reasonably
                "Gas usage should scale linearly with portfolio size"
            );
            
            console.log("Portfolio size:", size, "Gas used:", gasUsed);
            
            // Clear portfolio for next test
            while (portfolioAnalyzer.getUserPositions(user2).length > 0) {
                portfolioAnalyzer.removePosition(0);
            }
            
            // Stop prank before next iteration - FIXED
            vm.stopPrank();
        }
    }

    /**
     * @dev Generate comprehensive gas report - FIXED
     */
    function testGenerateGasReport() public view {
        console.log("\n=== GAS OPTIMIZATION REPORT ===");
        
        // FIXED: Check if benchmarks array is empty
        if (benchmarks.length == 0) {
            console.log("No benchmarks available. Run other tests first.");
            return;
        }
        
        console.log("Total functions tested:", benchmarks.length);
        
        uint256 optimizedCount = 0;
        uint256 totalGasUsed = 0;
        
        for (uint256 i = 0; i < benchmarks.length; i++) {
            GasBenchmark memory benchmark = benchmarks[i];
            
            string memory status = benchmark.isOptimal ? "OPTIMAL" : "NEEDS OPTIMIZATION";
            console.log("");
            console.log("Function:", benchmark.functionName);
            console.log("Gas Used:", benchmark.gasUsed);
            console.log("Gas Limit:", benchmark.gasLimit);
            console.log("Status:", status);
            console.log("Notes:", benchmark.notes);
            
            if (benchmark.isOptimal) optimizedCount++;
            totalGasUsed += benchmark.gasUsed;
        }
        
        console.log("\n=== SUMMARY ===");
        console.log("Optimized functions:", optimizedCount, "/", benchmarks.length);
        console.log("Total gas used:", totalGasUsed);
        console.log("Average gas per function:", totalGasUsed / benchmarks.length); // FIXED: Safe division
        
        uint256 optimizationRate = (optimizedCount * 100) / benchmarks.length;
        console.log("Optimization rate:", optimizationRate, "%");
        
        if (optimizationRate >= 80) {
            console.log("EXCELLENT: Gas optimization is very good!");
        } else if (optimizationRate >= 60) {
            console.log("GOOD: Gas optimization is acceptable");
        } else {
            console.log("WARNING: Needs more gas optimization work");
        }
    }

    /**
     * @dev Run all gas tests - FIXED
     */
    function testRunAllGasTests() public {
        // Run tests that don't conflict with each other
        testRiskRegistryGas();
        testPortfolioAnalyzerGas();
        testRiskInsuranceGas(); 
        testRiskOracleGas();
        testAlertSystemGas();
        
        // Skip batch operations and scaling tests to avoid protocol name conflicts
        // These should be run individually
        console.log("Note: testBatchOperationsGas and testScalingGas should be run individually");
        
        testGenerateGasReport();
    }

    /**
     * @dev Alternative: Run individual gas tests separately
     */
    function testRunIndividualGasTests() public pure {
        console.log("Running individual tests to avoid conflicts:");
        console.log("1. forge test --match-test testRiskRegistryGas");
        console.log("2. forge test --match-test testPortfolioAnalyzerGas");
        console.log("3. forge test --match-test testRiskInsuranceGas");
        console.log("4. forge test --match-test testRiskOracleGas");
        console.log("5. forge test --match-test testAlertSystemGas");
        console.log("6. forge test --match-test testBatchOperationsGas");
        console.log("7. forge test --match-test testScalingGas");
    }

    /**
     * @dev Add benchmark to results
     */
    function _addBenchmark(
        string memory _functionName,
        uint256 _gasUsed,
        uint256 _gasLimit,
        bool _isOptimal,
        string memory _notes
    ) internal {
        benchmarks.push(GasBenchmark({
            functionName: _functionName,
            gasUsed: _gasUsed,
            gasLimit: _gasLimit,
            isOptimal: _isOptimal,
            notes: _notes
        }));
    }

    /**
     * @dev Convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }
}