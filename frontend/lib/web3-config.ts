// lib/web3-config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalancheFuji } from 'wagmi/chains';
import { http } from 'viem';

// Avalanche Fuji Chain Configuration
export const CHAIN_CONFIG = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '43113'),
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Avalanche Fuji Testnet',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
  blockExplorer: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.snowtrace.io',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18
  }
};

// Smart Contract Addresses (from your deployment)
export const CONTRACT_ADDRESSES = {
  // Core Contracts
  CONTRACT_REGISTRY: process.env.NEXT_PUBLIC_CONTRACT_REGISTRY || '0xA65647C7335835F477831E4E907aBaA1560646a8',
  RISK_REGISTRY: process.env.NEXT_PUBLIC_RISK_REGISTRY || '0xF404b05B55850cBaC8891c9Db1524Fc1D437124C',
  RISK_ORACLE: process.env.NEXT_PUBLIC_RISK_ORACLE || '0x14Ca6F2BEd3FC051E1E8f409D04369A75894a4A8',
  PORTFOLIO_ANALYZER: process.env.NEXT_PUBLIC_PORTFOLIO_ANALYZER || '0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192',
  
  // Automation Contracts
  ALERT_SYSTEM: process.env.NEXT_PUBLIC_ALERT_SYSTEM || '0xe46F4AcC01B4664c50E421dBb50343096be05Ecc',
  RISK_GUARDIAN_MASTER: process.env.NEXT_PUBLIC_RISK_GUARDIAN_MASTER || '0x00F4Ce590406031E88666BF1Fd1310A809a8A3a0',
  
  // Insurance Contracts
  RISK_INSURANCE: process.env.NEXT_PUBLIC_RISK_INSURANCE || '0x6021d94b73D1b4b0515902BEa7bf17cE3dDa2e8F',
  
  // Hedge Contracts
  STOP_LOSS_HEDGE: process.env.NEXT_PUBLIC_STOP_LOSS_HEDGE || '0x1e7D390EB42112f33930A9Dab1cdeB848361f163',
  REBALANCE_HEDGE: process.env.NEXT_PUBLIC_REBALANCE_HEDGE || '0xe261a9e260C7F4aCB9E2a1c3daeb141791bbb600',
  VOLATILITY_HEDGE: process.env.NEXT_PUBLIC_VOLATILITY_HEDGE || '0x5C6c0B72FeDB3027eDee33C62bb7C5D3700a488F',
  CROSS_CHAIN_HEDGE: process.env.NEXT_PUBLIC_CROSS_CHAIN_HEDGE || '0xaC521848dC05C7fE4eb43236D1719AEA725143cF',
} as const;

// Mock Protocol Addresses for Development
export const MOCK_PROTOCOLS = {
  MOCK_UNISWAP: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  MOCK_AAVE: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  MOCK_COMPOUND: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
  CURVE: '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46'
} as const;

// Contract ABIs (simplified for key functions)
export const CONTRACT_ABIS = {
  PORTFOLIO_ANALYZER: [
    'function analyzePortfolio(address user) view returns (uint256 riskScore, string memory analysis)',
    'function getUserPositions(address user) view returns (address[] memory protocols, uint256[] memory amounts)',
    'function getTotalValue(address user) view returns (uint256 totalValue)'
  ],
  RISK_ORACLE: [
    'function getProtocolRisk(address protocol) view returns (uint256 riskScore)',
    'function getMarketRisk() view returns (uint256 marketRisk)',
    'function updateRiskData(address protocol, uint256 newRisk) external'
  ],
  RISK_REGISTRY: [
    'function registerProtocol(address protocol, string memory name, uint256 riskCategory) external',
    'function getProtocolInfo(address protocol) view returns (string memory name, uint256 riskCategory, bool active)',
    'function getAllProtocols() view returns (address[] memory)'
  ],
  ALERT_SYSTEM: [
    'function createAlert(address user, uint256 threshold) returns (uint256 alertId)',
    'function getActiveAlerts(address user) view returns (uint256[] memory)',
    'function getUserAlertsCount(address user) view returns (uint256)'
  ],
  RISK_INSURANCE: [
    'function createPolicy(address user, address protocol, uint256 coverage) returns (uint256 policyId)',
    'function getUserPolicies(address user) view returns (uint256[] memory)',
    'function getPolicyInfo(uint256 policyId) view returns (address user, address protocol, uint256 coverage, bool active)'
  ]
} as const;

// Wagmi Configuration Factory - evita múltiplas inicializações
let wagmiConfigInstance: ReturnType<typeof getDefaultConfig> | null = null;

export function getWagmiConfig() {
  if (!wagmiConfigInstance) {
    wagmiConfigInstance = getDefaultConfig({
      appName: 'DefiGuardian AI',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
      chains: [avalancheFuji],
      transports: {
        [avalancheFuji.id]: http(CHAIN_CONFIG.rpcUrl),
      },
      ssr: true,
    });
  }
  return wagmiConfigInstance;
}

// Backward compatibility
export const config = getWagmiConfig();

// Helper function to get contract address by name
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES): string {
  return CONTRACT_ADDRESSES[contractName];
}

// Helper function to get contract ABI by name  
export function getContractABI(contractName: keyof typeof CONTRACT_ABIS): readonly string[] {
  return CONTRACT_ABIS[contractName];
}

// Network configuration for manual wallet connection
export const NETWORK_CONFIG = {
  chainId: `0x${CHAIN_CONFIG.chainId.toString(16)}`, // Convert to hex
  chainName: CHAIN_CONFIG.chainName,
  nativeCurrency: CHAIN_CONFIG.nativeCurrency,
  rpcUrls: [CHAIN_CONFIG.rpcUrl],
  blockExplorerUrls: [CHAIN_CONFIG.blockExplorer]
};

// Development settings
export const DEV_CONFIG = {
  enableTestnets: process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true',
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
};

export default {
  CHAIN_CONFIG,
  CONTRACT_ADDRESSES,
  MOCK_PROTOCOLS,
  CONTRACT_ABIS,
  DEV_CONFIG,
  NETWORK_CONFIG,
  config
};