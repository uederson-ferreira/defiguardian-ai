// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

/**
 * @title NetworkConfig
 * @dev Specific configurations for each network
 */
contract NetworkConfig is Script {
    
    struct NetworkParams {
        string name;
        uint256 chainId;
        string rpcUrl;
        address deployer;
        bool hasRealProtocols;
        bool hasCCIP;
        uint256 deploymentCost;
    }
    
    struct CCIPConfig {
        address router;
        address linkToken;
        uint64 chainSelector;
        bool isSupported;
    }
    
    mapping(uint256 => NetworkParams) public networks;
    mapping(uint256 => CCIPConfig) public ccipConfigs;
    
    constructor() {
        _setupNetworks();
        _setupCCIP();
    }
    
    function _setupNetworks() internal {
        // Ethereum Mainnet
        networks[1] = NetworkParams({
            name: "Ethereum Mainnet",
            chainId: 1,
            rpcUrl: "https://mainnet.infura.io/v3/",
            deployer: address(0),
            hasRealProtocols: true,
            hasCCIP: true,
            deploymentCost: 0.5 ether
        });
        
        // Sepolia Testnet
        networks[11155111] = NetworkParams({
            name: "Sepolia Testnet",
            chainId: 11155111,
            rpcUrl: "https://sepolia.infura.io/v3/",
            deployer: address(0),
            hasRealProtocols: true,
            hasCCIP: true,
            deploymentCost: 0.1 ether
        });
        
        // Polygon Mainnet
        networks[137] = NetworkParams({
            name: "Polygon Mainnet",
            chainId: 137,
            rpcUrl: "https://polygon-mainnet.infura.io/v3/",
            deployer: address(0),
            hasRealProtocols: true,
            hasCCIP: true,
            deploymentCost: 50 ether // MATIC
        });
        
        // Arbitrum One
        networks[42161] = NetworkParams({
            name: "Arbitrum One",
            chainId: 42161,
            rpcUrl: "https://arbitrum-mainnet.infura.io/v3/",
            deployer: address(0),
            hasRealProtocols: true,
            hasCCIP: true,
            deploymentCost: 0.01 ether
        });
        
        // Local Anvil
        networks[31337] = NetworkParams({
            name: "Local Anvil",
            chainId: 31337,
            rpcUrl: "http://localhost:8545",
            deployer: address(0),
            hasRealProtocols: false,
            hasCCIP: false,
            deploymentCost: 0
        });
    }
    
    function _setupCCIP() internal {
        // Ethereum Mainnet
        ccipConfigs[1] = CCIPConfig({
            router: 0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D,
            linkToken: 0x514910771AF9Ca656af840dff83E8264EcF986CA,
            chainSelector: 5009297550715157269,
            isSupported: true
        });
        
        // Sepolia Testnet  
        ccipConfigs[11155111] = CCIPConfig({
            router: 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59,
            linkToken: 0x779877A7B0D9E8603169DdbD7836e478b4624789,
            chainSelector: 16015286601757825753,
            isSupported: true
        });
        
        // Polygon Mainnet
        ccipConfigs[137] = CCIPConfig({
            router: 0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe,
            linkToken: 0xb0897686c545045aFc77CF20eC7A532E3120E0F1,
            chainSelector: 4051577828743386545,
            isSupported: true
        });
        
        // Arbitrum One
        ccipConfigs[42161] = CCIPConfig({
            router: 0x141fa059441E0ca23ce184B6A78bafD2A517DdE8,
            linkToken: 0xf97f4df75117a78c1A5a0DBb814Af92458539FB4,
            chainSelector: 4949039107694359620,
            isSupported: true
        });
    }
    
    function getNetworkParams(uint256 chainId) external view returns (NetworkParams memory) {
        return networks[chainId];
    }
    
    function getCCIPConfig(uint256 chainId) external view returns (CCIPConfig memory) {
        return ccipConfigs[chainId];
    }
    
    function isNetworkSupported(uint256 chainId) external view returns (bool) {
        return bytes(networks[chainId].name).length > 0;
    }
    
    function isCCIPSupported(uint256 chainId) external view returns (bool) {
        return ccipConfigs[chainId].isSupported;
    }
}

/**
 * @title VerifyDeployment
 * @dev Script to verify deployment post-deploy
 */
contract VerifyDeployment is Script {
    
    struct DeploymentInfo {
        address riskRegistry;
        address riskOracle;
        address portfolioAnalyzer;
        address alertSystem;
        address stopLossHedge;
        address rebalanceHedge;
        address riskGuardianMaster;
        address riskInsurance;
    }
    
    function run() external view {
        console.log("VERIFYING DEPLOYMENT");
        console.log("Network:", _getNetworkName());
        console.log("Chain ID:", block.chainid);
        console.log("");
        
        // Load deployed addresses (would be from file in real implementation)
        DeploymentInfo memory info = _loadDeployedAddresses();
        
        // Verify each contract
        _verifyContract("RiskRegistry", info.riskRegistry);
        _verifyContract("RiskOracle", info.riskOracle);
        _verifyContract("PortfolioAnalyzer", info.portfolioAnalyzer);
        _verifyContract("AlertSystem", info.alertSystem);
        _verifyContract("StopLossHedge", info.stopLossHedge);
        _verifyContract("RebalanceHedge", info.rebalanceHedge);
        _verifyContract("RiskGuardianMaster", info.riskGuardianMaster);
        _verifyContract("RiskInsurance", info.riskInsurance);
        
        console.log("");
        console.log("Deployment verification completed!");
    }
    
    function _verifyContract(string memory name, address addr) internal view {
        if (addr == address(0)) {
            console.log("", name, ": NOT DEPLOYED");
            return;
        }
        
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(addr)
        }
        
        if (codeSize > 0) {
            console.log("", name, ":", addr);
        } else {
            console.log("", name, ": NO CODE AT ADDRESS");
        }
    }
    
    function _loadDeployedAddresses() internal pure returns (DeploymentInfo memory) {
        // In real implementation, this would load from JSON file
        return DeploymentInfo({
            riskRegistry: address(0),
            riskOracle: address(0),
            portfolioAnalyzer: address(0),
            alertSystem: address(0),
            stopLossHedge: address(0),
            rebalanceHedge: address(0),
            riskGuardianMaster: address(0),
            riskInsurance: address(0)
        });
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
