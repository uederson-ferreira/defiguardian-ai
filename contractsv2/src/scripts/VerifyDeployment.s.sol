// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//src/scripts/VerifyDeployment.s.sol

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import das interfaces
import "../interfaces/IRiskRegistry.sol";
import "../interfaces/IRiskOracle.sol";
import "../interfaces/IPortfolioAnalyzer.sol";
import "../interfaces/IAlertSystem.sol";

/**
 * @title VerifyDeployment
 * @dev Script robusto para verificar deployment sem depender de métodos não-padrão
 */
contract VerifyDeployment is Script {
    
    struct DeploymentInfo {
        address riskRegistry;
        address riskOracle;
        address portfolioAnalyzer;
        address alertSystem;
        address stopLossHedge;
        address rebalanceHedge;
        address volatilityHedge;
        address crossChainHedge;
        address riskGuardianMaster;
        address riskInsurance;
    }
    
    struct VerificationResult {
        bool isDeployed;
        bool hasCode;
        bool isConfigured;
        bool isIntegrated;
        string status;
    }

    function run() external view {
        console.log("=== COMPLETE DEPLOYMENT VERIFICATION ===");
        console.log("Network:", _getNetworkName());
        console.log("Chain ID:", block.chainid);
        console.log("Timestamp:", block.timestamp);
        console.log("");
        
        // Load contract addresses
        DeploymentInfo memory info = _loadDeployedAddresses();
        
        // Verificar cada contrato
        console.log("=== CONTRACT VERIFICATION ===");
        console.log("");
        
        _verifyContract("RiskRegistry", info.riskRegistry);
        _verifyContract("RiskOracle", info.riskOracle);
        _verifyContract("PortfolioAnalyzer", info.portfolioAnalyzer);
        _verifyContract("AlertSystem", info.alertSystem);
        _verifyContract("StopLossHedge", info.stopLossHedge);
        _verifyContract("RebalanceHedge", info.rebalanceHedge);
        _verifyContract("VolatilityHedge", info.volatilityHedge);
        _verifyContract("CrossChainHedge", info.crossChainHedge);
        _verifyContract("RiskGuardianMaster", info.riskGuardianMaster);
        _verifyContract("RiskInsurance", info.riskInsurance);
        
        // Verify integrations
        console.log("=== INTEGRATION VERIFICATION ===");
        console.log("");
        _verifyIntegrations(info);
        
        // Verify configurations
        console.log("=== CONFIGURATION VERIFICATION ===");
        console.log("");
        _verifyConfigurations(info);
        
        // Verificar dados
        console.log("=== DATA VERIFICATION ===");
        console.log("");
        _verifyData(info);
        
        // Resumo final
        console.log("=== VERIFICATION SUMMARY ===");
        console.log("");
        _printSummary(info);
        
        console.log("=== Complete verification finished! ===");
    }

    function _loadDeployedAddresses() internal view returns (DeploymentInfo memory) {
        // Tentar carregar do ambiente
        DeploymentInfo memory info = DeploymentInfo({
            riskRegistry: vm.envOr("RISK_REGISTRY_ADDRESS", address(0)),
            riskOracle: vm.envOr("RISK_ORACLE_ADDRESS", address(0)),
            portfolioAnalyzer: vm.envOr("PORTFOLIO_ANALYZER_ADDRESS", address(0)),
            alertSystem: vm.envOr("ALERT_SYSTEM_ADDRESS", address(0)),
            stopLossHedge: vm.envOr("STOP_LOSS_HEDGE_ADDRESS", address(0)),
            rebalanceHedge: vm.envOr("REBALANCE_HEDGE_ADDRESS", address(0)),
            volatilityHedge: vm.envOr("VOLATILITY_HEDGE_ADDRESS", address(0)),
            crossChainHedge: vm.envOr("CROSS_CHAIN_HEDGE_ADDRESS", address(0)),
            riskGuardianMaster: vm.envOr("RISK_GUARDIAN_MASTER_ADDRESS", address(0)),
            riskInsurance: vm.envOr("RISK_INSURANCE_ADDRESS", address(0))
        });
        
        return info;
    }

    function _verifyContract(string memory name, address addr) internal view returns (VerificationResult memory) {
        VerificationResult memory result;
        
        if (addr == address(0)) {
            result = VerificationResult({
                isDeployed: false,
                hasCode: false,
                isConfigured: false,
                isIntegrated: false,
                status: "NOT_DEPLOYED"
            });
            console.log("Status [", name, "]: NOT DEPLOYED");
            return result;
        }
        
        // Verify if it has code
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(addr)
        }
        
        if (codeSize == 0) {
            result = VerificationResult({
                isDeployed: true,
                hasCode: false,
                isConfigured: false,
                isIntegrated: false,
                status: "NO_CODE"
            });
            console.log("Status [", name, "]: NO CODE AT ADDRESS");
            return result;
        }
        
        result.isDeployed = true;
        result.hasCode = true;
        result.status = "DEPLOYED";
        
        console.log("Status [", name, "]: DEPLOYED");
        console.log("   Address:", addr);
        console.log("   Code Size:", codeSize, "bytes");
        
        return result;
    }

    function _verifyIntegrations(DeploymentInfo memory info) internal view {
        console.log("Checking integrations...");
        
        // ✅ MÉTODO ROBUSTO: Usar interface baixo-nível para verificar
        if (info.riskRegistry != address(0) && info.portfolioAnalyzer != address(0)) {
            // Tentar chamada baixo-nível para verificar se contratos são compatíveis
            (bool success, ) = info.portfolioAnalyzer.staticcall(
                abi.encodeWithSignature("riskRegistry()")
            );
            
            if (success) {
                console.log("Integration: PortfolioAnalyzer <=> RiskRegistry: OK");
            } else {
                console.log("Integration: PortfolioAnalyzer <=> RiskRegistry: FAILED");
            }
        }
        
        if (info.alertSystem != address(0) && info.riskOracle != address(0)) {
            (bool success, ) = info.alertSystem.staticcall(
                abi.encodeWithSignature("riskOracle()")
            );
            
            if (success) {
                console.log("Integration: AlertSystem <=> RiskOracle: OK");
            } else {
                console.log("Integration: AlertSystem <=> RiskOracle: FAILED");
            }
        }
        
        console.log("");
    }

    function _verifyConfigurations(DeploymentInfo memory info) internal view {
        console.log("Checking configurations...");
        
        // Verify if protocols are registered
        if (info.riskRegistry != address(0)) {
            try IRiskRegistry(info.riskRegistry).getAllProtocols() returns (address[] memory protocols) {
                console.log("Registered protocols:", protocols.length);
                
                if (protocols.length > 0) {
                    console.log("   Sample protocols found");
                    // Verificar primeiro protocolo apenas
                    address firstProtocol = protocols[0];
                    console.log("   First protocol address:", firstProtocol);
                }
            } catch {
                console.log("Error: Cannot check registered protocols");
            }
        }
        
        // ✅ VERIFICAÇÃO MAIS ROBUSTA: Tentar diferentes métodos
        if (info.riskOracle != address(0)) {
            // Método 1: Tentar verificar se contrato responde a chamadas básicas
            (bool success, ) = info.riskOracle.staticcall(
                abi.encodeWithSignature("isRiskDataFresh(address)", address(0))
            );
            
            if (success) {
                console.log("Risk Oracle: Responsive to calls");
            } else {
                console.log("Risk Oracle: Not responsive");
            }
        }
        
        console.log("");
    }

    function _verifyData(DeploymentInfo memory info) internal view {
        console.log("Checking data availability...");
        
        // Verify if risk data is available
        if (info.riskRegistry != address(0) && info.riskOracle != address(0)) {
            try IRiskRegistry(info.riskRegistry).getAllProtocols() returns (address[] memory protocols) {
                if (protocols.length > 0) {
                    address firstProtocol = protocols[0];
                    
                    try IRiskOracle(info.riskOracle).getAggregatedRisk(firstProtocol) returns (
                        uint256,
                        uint256,
                        uint256,
                        uint256,
                        uint256,
                        uint256 overallRisk,
                        uint256 timestamp
                    ) {
                        console.log("Risk data: Available");
                        console.log("   Protocol:", firstProtocol);
                        console.log("   Overall Risk:", overallRisk, "/ 10000");
                        console.log("   Last Update:", timestamp);
                        
                        // Verify if data is fresh (last 24h)
                        if (block.timestamp - timestamp <= 86400) {
                            console.log("   Data freshness: Fresh (< 24h)");
                        } else {
                            console.log("   Data freshness: Stale (> 24h)");
                        }
                        
                        // Verificar freshness via oracle
                        try IRiskOracle(info.riskOracle).isRiskDataFresh(firstProtocol) returns (bool isFresh) {
                            console.log("   Oracle fresh status:", isFresh ? "Fresh" : "Stale");
                        } catch {
                            console.log("   Oracle fresh status: Cannot determine");
                        }
                        
                    } catch {
                        console.log("Error: Cannot get risk data");
                    }
                }
            } catch {
                console.log("Error: Cannot verify data");
            }
        }
        
        console.log("");
    }

    function _printSummary(DeploymentInfo memory info) internal pure {
        uint256 deployedCount = 0;
        uint256 totalCount = 10;
        
        if (info.riskRegistry != address(0)) deployedCount++;
        if (info.riskOracle != address(0)) deployedCount++;
        if (info.portfolioAnalyzer != address(0)) deployedCount++;
        if (info.alertSystem != address(0)) deployedCount++;
        if (info.stopLossHedge != address(0)) deployedCount++;
        if (info.rebalanceHedge != address(0)) deployedCount++;
        if (info.volatilityHedge != address(0)) deployedCount++;
        if (info.crossChainHedge != address(0)) deployedCount++;
        if (info.riskGuardianMaster != address(0)) deployedCount++;
        if (info.riskInsurance != address(0)) deployedCount++;
        
        console.log("Summary: Deployed contracts:", deployedCount, "/", totalCount);
        
        uint256 percentage = (deployedCount * 100) / totalCount;
        console.log("Summary: Deployment completeness:", percentage, "%");
        
        if (percentage == 100) {
            console.log("Status: COMPLETE DEPLOYMENT!");
        } else if (percentage >= 80) {
            console.log("Status: ALMOST COMPLETE DEPLOYMENT");
        } else if (percentage >= 50) {
            console.log("Status: PARTIAL DEPLOYMENT");
        } else {
            console.log("Status: INCOMPLETE DEPLOYMENT");
        }
        
        // General status
        bool hasCore = info.riskRegistry != address(0) && 
                       info.riskOracle != address(0) && 
                       info.portfolioAnalyzer != address(0);
        
        if (hasCore) {
            console.log("Core status: Functional");
        } else {
            console.log("Core status: Incomplete");
        }
        
        bool hasHedging = info.stopLossHedge != address(0) || 
                         info.rebalanceHedge != address(0) || 
                         info.volatilityHedge != address(0);
        
        if (hasHedging) {
            console.log("Hedge status: Available");
        } else {
            console.log("Hedge status: Not deployed");
        }
        
        console.log("");
        console.log("=== VERIFICATION COMPLETE ===");
    }

    function _getNetworkName() internal view returns (string memory) {
        if (block.chainid == 1) return "Ethereum Mainnet";
        if (block.chainid == 11155111) return "Sepolia Testnet";
        if (block.chainid == 137) return "Polygon Mainnet";
        if (block.chainid == 42161) return "Arbitrum One";
        if (block.chainid == 31337) return "Local Anvil";
        return "Unknown Network";
    }
}