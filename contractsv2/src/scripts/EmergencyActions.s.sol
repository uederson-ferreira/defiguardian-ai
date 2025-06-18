// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//src/scripts/EmergencyActions.s.sol

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import of contracts - corrigir caminhos
import "../automation/RiskGuardianMaster.sol";
import "../automation/AlertSystem.sol";
import "../hedging/StopLossHedge.sol";
import "../hedging/RebalanceHedge.sol";
import "../insurance/RiskInsurance.sol";

/**
 * @title EmergencyActions
 * @dev Script for emergency actions in the system
 */
contract EmergencyActions is Script {
    
    // Contracts
    RiskGuardianMaster riskGuardianMaster;
    AlertSystem alertSystem;
    StopLossHedge stopLossHedge;
    RebalanceHedge rebalanceHedge;
    RiskInsurance riskInsurance;
    
    uint256 public chainId;
    address public emergencyOperator;

    // Emergency configuration struct
    struct EmergencyConfig {
        bool stopLossEnabled;
        bool rebalanceEnabled;
        bool volatilityEnabled;
        bool crossChainEnabled;
        uint256 checkInterval;
        uint256 maxGasPerUpkeep;
    }

    modifier onlyEmergency() {
        require(
            msg.sender == emergencyOperator || 
            msg.sender == vm.envAddress("EMERGENCY_OPERATOR"),
            "Not authorized for emergency actions"
        );
        _;
    }

    function setUp() external {
        chainId = block.chainid;
        emergencyOperator = vm.envOr("EMERGENCY_OPERATOR", vm.envAddress("DEPLOYER_ADDRESS"));
        
        console.log("EMERGENCY ACTIONS SETUP");
        console.log("Network:", _getNetworkName());
        console.log("Emergency Operator:", emergencyOperator);
        console.log("");
        
        _loadContracts();
    }

    function _loadContracts() internal {
        address masterAddr = vm.envOr("RISK_GUARDIAN_MASTER_ADDRESS", address(0));
        address alertAddr = vm.envOr("ALERT_SYSTEM_ADDRESS", address(0));
        address stopLossAddr = vm.envOr("STOP_LOSS_HEDGE_ADDRESS", address(0));
        address rebalanceAddr = vm.envOr("REBALANCE_HEDGE_ADDRESS", address(0));
        address insuranceAddr = vm.envOr("RISK_INSURANCE_ADDRESS", address(0));
        
        if (masterAddr != address(0)) riskGuardianMaster = RiskGuardianMaster(masterAddr);
        if (alertAddr != address(0)) alertSystem = AlertSystem(alertAddr);
        if (stopLossAddr != address(0)) stopLossHedge = StopLossHedge(stopLossAddr);
        if (rebalanceAddr != address(0)) rebalanceHedge = RebalanceHedge(rebalanceAddr);
        if (insuranceAddr != address(0)) riskInsurance = RiskInsurance(insuranceAddr);
        
        console.log("Emergency contracts loaded:");
        if (masterAddr != address(0)) console.log("   RiskGuardianMaster:", masterAddr);
        if (alertAddr != address(0)) console.log("   AlertSystem:", alertAddr);
        if (stopLossAddr != address(0)) console.log("   StopLossHedge:", stopLossAddr);
        if (rebalanceAddr != address(0)) console.log("   RebalanceHedge:", rebalanceAddr);
        if (insuranceAddr != address(0)) console.log("   RiskInsurance:", insuranceAddr);
        console.log("");
    }

    /**
     * @dev EMERGENCY: Pause all contracts
     */
    function pauseAllContracts() external {
        _loadContracts();
        chainId = block.chainid;
        emergencyOperator = vm.envOr("EMERGENCY_OPERATOR", vm.envAddress("DEPLOYER_ADDRESS"));
        
        console.log("EMERGENCY: PAUSING ALL CONTRACTS");
        console.log("WARNING: This will halt all automated functions");
        console.log("Operator:", emergencyOperator);
        console.log("");
        
        vm.startBroadcast(emergencyOperator);
        
        uint256 pausedCount = 0;
        
        // Pause RiskGuardianMaster (stop all automation)
        if (address(riskGuardianMaster) != address(0)) {
            try riskGuardianMaster.emergencyPause() {
                console.log("RiskGuardianMaster paused");
                pausedCount++;
            } catch {
                console.log("Failed to pause RiskGuardianMaster");
            }
        }
        
        // Pause AlertSystem
        if (address(alertSystem) != address(0)) {
            try alertSystem.pause() {
                console.log("AlertSystem paused");
                pausedCount++;
            } catch {
                console.log("Failed to pause AlertSystem");
            }
        }
        
        // Pause RiskInsurance
        if (address(riskInsurance) != address(0)) {
            try riskInsurance.pause() {
                console.log("RiskInsurance paused");
                pausedCount++;
            } catch {
                console.log("Failed to pause RiskInsurance");
            }
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("Emergency pause completed");
        console.log("Contracts paused:", pausedCount);
        
        if (pausedCount > 0) {
            console.log("System is now in emergency mode");
        } else {
            console.log("No contracts could be paused");
        }
    }

    /**
     * @dev EMERGENCY: Unpause all contracts
     */
    function unpauseAllContracts() external {
        _loadContracts();
        chainId = block.chainid;
        emergencyOperator = vm.envOr("EMERGENCY_OPERATOR", vm.envAddress("DEPLOYER_ADDRESS"));
        
        console.log("EMERGENCY: UNPAUSING ALL CONTRACTS");
        console.log("WARNING: This will resume all automated functions");
        console.log("");
        
        vm.startBroadcast(emergencyOperator);
        
        uint256 unpausedCount = 0;
        
        // Unpause RiskGuardianMaster
        if (address(riskGuardianMaster) != address(0)) {
            try riskGuardianMaster.updateAutomationConfig(
                true,    // stopLoss enabled
                true,    // rebalance enabled
                true,    // volatility enabled
                true,    // crossChain enabled
                300,     // 5 min interval
                400000   // 400k gas
            ) {
                console.log("RiskGuardianMaster unpaused");
                unpausedCount++;
            } catch {
                console.log("Failed to unpause RiskGuardianMaster");
            }
        }
        
        // Unpause AlertSystem
        if (address(alertSystem) != address(0)) {
            try alertSystem.unpause() {
                console.log("AlertSystem unpaused");
                unpausedCount++;
            } catch {
                console.log("Failed to unpause AlertSystem");
            }
        }
        
        // Unpause RiskInsurance
        if (address(riskInsurance) != address(0)) {
            try riskInsurance.unpause() {
                console.log("RiskInsurance unpaused");
                unpausedCount++;
            } catch {
                console.log("Failed to unpause RiskInsurance");
            }
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("Emergency unpause completed");
        console.log("Contracts unpaused:", unpausedCount);
        
        if (unpausedCount > 0) {
            console.log("System is now operational");
        } else {
            console.log("No contracts could be unpaused");
        }
    }

    /**
     * @dev EMERGENCY: Withdraw emergency funds
     */
    function emergencyWithdraw() external {
        _loadContracts();
        chainId = block.chainid;
        emergencyOperator = vm.envOr("EMERGENCY_OPERATOR", vm.envAddress("DEPLOYER_ADDRESS"));
        
        console.log("EMERGENCY: WITHDRAWING FUNDS");
        console.log("WARNING: This will attempt to recover all available funds");
        console.log("");
        
        vm.startBroadcast(emergencyOperator);
        
        uint256 totalRecovered = 0;
        
        // Withdraw fees from StopLossHedge
        if (address(stopLossHedge) != address(0)) {
            uint256 balanceBefore = emergencyOperator.balance;
            try stopLossHedge.withdrawFees() {
                uint256 recovered = emergencyOperator.balance - balanceBefore;
                console.log("StopLossHedge fees withdrawn:", recovered, "wei");
                totalRecovered += recovered;
            } catch {
                console.log("Failed to withdraw StopLossHedge fees");
            }
        }
        
        // Withdraw fees from RebalanceHedge
        if (address(rebalanceHedge) != address(0)) {
            uint256 balanceBefore = emergencyOperator.balance;
            try rebalanceHedge.withdrawFees() {
                uint256 recovered = emergencyOperator.balance - balanceBefore;
                console.log("RebalanceHedge fees withdrawn:", recovered, "wei");
                totalRecovered += recovered;
            } catch {
                console.log("Failed to withdraw RebalanceHedge fees");
            }
        }
        
        // Withdraw excess from RiskInsurance
        if (address(riskInsurance) != address(0)) {
            try riskInsurance.withdrawExcess(1 ether) { // Try to withdraw 1 ETH
                console.log("RiskInsurance excess withdrawn");
                totalRecovered += 1 ether;
            } catch {
                console.log("Failed to withdraw RiskInsurance excess");
            }
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("Emergency withdrawal completed");
        console.log("Total recovered:", totalRecovered, "wei");
        
        if (totalRecovered > 0) {
            console.log("Funds successfully recovered");
        } else {
            console.log("No funds available for recovery");
        }
    }

    /**
     * @dev EMERGENCY: Emergency status check
     */
    function emergencyStatusCheck() external view {
        console.log("EMERGENCY STATUS CHECK");
        console.log("Network:", _getNetworkName());
        console.log("Timestamp:", block.timestamp);
        console.log("");
        
        // Check status of each contract
        console.log("Contract Status:");
        
        // RiskGuardianMaster
        if (address(riskGuardianMaster) != address(0)) {
            try riskGuardianMaster.getAutomationConfig() returns (
                RiskGuardianMaster.AutomationConfig memory config
            ) {
                console.log("   RiskGuardianMaster:");
                console.log("     StopLoss:", config.stopLossEnabled ? "ENABLED" : "DISABLED");
                console.log("     Rebalance:", config.rebalanceEnabled ? "ENABLED" : "DISABLED");
                console.log("     Volatility:", config.volatilityEnabled ? "ENABLED" : "DISABLED");
                console.log("     Interval:", config.checkInterval, "seconds");
            } catch {
                console.log("   RiskGuardianMaster: ERROR");
            }
        } else {
            console.log("   RiskGuardianMaster: NOT DEPLOYED");
        }
        
        // Check contract balances
        console.log("");
        console.log("Contract Balances:");
        
        if (address(stopLossHedge) != address(0)) {
            uint256 balance = address(stopLossHedge).balance;
            console.log("   StopLossHedge:", balance, "wei");
        }
        
        if (address(rebalanceHedge) != address(0)) {
            uint256 balance = address(rebalanceHedge).balance;
            console.log("   RebalanceHedge:", balance, "wei");
        }
        
        if (address(riskInsurance) != address(0)) {
            uint256 balance = address(riskInsurance).balance;
            console.log("   RiskInsurance:", balance, "wei");
        }
        
        console.log("");
        console.log("Emergency status check completed");
    }

    /**
     * @dev EMERGENCY: Complete system reset
     */
    function emergencyReset() external {
        _loadContracts();
        chainId = block.chainid;
        emergencyOperator = vm.envOr("EMERGENCY_OPERATOR", vm.envAddress("DEPLOYER_ADDRESS"));
        
        console.log("EMERGENCY: SYSTEM RESET");
        console.log("WARNING: This will reset all system configurations");
        console.log("WARNING: This is a destructive operation");
        console.log("");
        
        vm.startBroadcast(emergencyOperator);
        
        // 1. Pause everything
        console.log("Step 1: Pausing all systems...");
        if (address(riskGuardianMaster) != address(0)) {
            try riskGuardianMaster.emergencyPause() {
                console.log("Master system paused");
            } catch {
                console.log("Failed to pause master system");
            }
        }
        
        // 2. Disable automation
        console.log("Step 2: Disabling automation...");
        if (address(riskGuardianMaster) != address(0)) {
            try riskGuardianMaster.updateAutomationConfig(
                false, false, false, false, // Everything disabled
                86400, // 24h interval (very long)
                100000 // Low gas
            ) {
                console.log("Automation disabled");
            } catch {
                console.log("Failed to disable automation");
            }
        }
        
        // 3. Enter safe mode
        console.log("Step 3: Entering safe mode...");
        // Here we would transfer ownership to a secure address
        // For safety, not implemented in the script
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("EMERGENCY RESET COMPLETED");
        console.log("System is now in emergency safe mode");
        console.log("Manual intervention required to restore");
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