// Web3 Configuration for DefiGuardian Frontend
// Avalanche Fuji Testnet Integration

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

// Smart Contract Addresses
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
  CROSS_CHAIN_HEDGE: process.env.NEXT_PUBLIC_CROSS_CHAIN_HEDGE || '0xaC521848dC05C7fE4eb43236D1719AEA725143cF'
};

// Mock Protocol Addresses (for testing)
export const MOCK_PROTOCOLS = {
  COMPOUND_V3: process.env.NEXT_PUBLIC_COMPOUND_V3_MOCK || '0xBf863e9edd0684c7C45793A2C15F35DeF78cb28c',
  LIDO: process.env.NEXT_PUBLIC_LIDO_MOCK || '0xE1AbA07004A31FefB36c927FAa98Dd6D04d1CC21',
  CURVE: process.env.NEXT_PUBLIC_CURVE_MOCK || '0x26D6199f59bb8fecC4C2F1bd49708Ad4FeBa8342',
  BALANCER: process.env.NEXT_PUBLIC_BALANCER_MOCK || '0x1275a590e071fb6f2DF43863109f1318007e5627',
  YEARN: process.env.NEXT_PUBLIC_YEARN_MOCK || '0xE5fc6650Cd5884B8701b8cb43bdaEDa7faB00FBf',
  MOCK_AAVE: process.env.NEXT_PUBLIC_MOCK_PROTOCOL_1 || '0x0000000000000000000000000000000000000000',
  MOCK_COMPOUND: process.env.NEXT_PUBLIC_MOCK_PROTOCOL_2 || '0x0000000000000000000000000000000000000000',
  MOCK_UNISWAP: process.env.NEXT_PUBLIC_MOCK_PROTOCOL_3 || '0x0000000000000000000000000000000000000000'
};

// Mock Price Feed Addresses
export const MOCK_PRICE_FEEDS = {
  WBTC_USD: process.env.NEXT_PUBLIC_WBTC_USD_MOCK_FEED || '0xe9c00f0287fe9b9815d7b8F0a5e24A5aA7983C35',
  USDT_USD: process.env.NEXT_PUBLIC_USDT_USD_MOCK_FEED || '0x1d12a0Ae03EeeA2251f4227c6A6C129f76d37C1B',
  AAVE_USD: process.env.NEXT_PUBLIC_AAVE_USD_MOCK_FEED || '0xe8b6A9Fa44E7EccF20995a1f669A47B312EC3103',
  COMP_USD: process.env.NEXT_PUBLIC_COMP_USD_MOCK_FEED || '0x9A32e45045933dB7e29AA59A9cDa375FfF875ba2',
  CRV_USD: process.env.NEXT_PUBLIC_CRV_USD_MOCK_FEED || '0xfB0Df246ac045cCd8c9a23528538a0F42DB90376',
  LDO_USD: process.env.NEXT_PUBLIC_LDO_USD_MOCK_FEED || '0xD00284526a6666A163548Fa747B98FE0FEe0e17d',
  BAL_USD: process.env.NEXT_PUBLIC_BAL_USD_MOCK_FEED || '0x38a027F9bf8AAdACC54a790EE75e241039D8Ba16',
  YFI_USD: process.env.NEXT_PUBLIC_YFI_USD_MOCK_FEED || '0xB34dD121C800c56198880D85161869A475906c6d'
};

// Contract ABIs (simplified for frontend use)
export const CONTRACT_ABIS = {
  PORTFOLIO_ANALYZER: [
    'function analyzePortfolio(address user) view returns (uint256 riskScore, string memory analysis)',
    'function getPositions(address user) view returns (tuple(address protocol, address token, uint256 amount)[])',
    'function getTotalValue(address user) view returns (uint256)',
    'function getAssetAllocation(address user) view returns (string[] memory assets, uint256[] memory percentages)'
  ],
  RISK_ORACLE: [
    'function getProtocolRisk(address protocol) view returns (uint256)',
    'function getTokenRisk(address token) view returns (uint256)',
    'function getMarketRisk() view returns (uint256)'
  ],
  RISK_REGISTRY: [
    'function getAllProtocols() view returns (address[])',
    'function getProtocolInfo(address protocol) view returns (string memory name, uint256 riskLevel)'
  ],
  ALERT_SYSTEM: [
    'function createAlert(address user, uint8 alertType, uint256 threshold) returns (uint256 alertId)',
    'function getActiveAlerts(address user) view returns (uint256[] memory)',
    'function getUserAlertsCount(address user) view returns (uint256)'
  ],
  RISK_INSURANCE: [
    'function createPolicy(address user, address protocol, uint256 coverage) returns (uint256 policyId)',
    'function getUserPolicies(address user) view returns (uint256[] memory)',
    'function getPolicyInfo(uint256 policyId) view returns (address user, address protocol, uint256 coverage, bool active)'
  ]
};

// Development settings
export const DEV_CONFIG = {
  enableTestnets: process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true',
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
};

// Helper function to get contract address by name
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES): string {
  return CONTRACT_ADDRESSES[contractName];
}

// Helper function to get contract ABI by name
export function getContractABI(contractName: keyof typeof CONTRACT_ABIS): string[] {
  return CONTRACT_ABIS[contractName];
}

// Network configuration for wallet connection
export const NETWORK_CONFIG = {
  chainId: `0x${CHAIN_CONFIG.chainId.toString(16)}`, // Convert to hex
  chainName: CHAIN_CONFIG.chainName,
  nativeCurrency: CHAIN_CONFIG.nativeCurrency,
  rpcUrls: [CHAIN_CONFIG.rpcUrl],
  blockExplorerUrls: [CHAIN_CONFIG.blockExplorer]
};

export default {
  CHAIN_CONFIG,
  CONTRACT_ADDRESSES,
  MOCK_PROTOCOLS,
  MOCK_PRICE_FEEDS,
  CONTRACT_ABIS,
  DEV_CONFIG,
  NETWORK_CONFIG
};