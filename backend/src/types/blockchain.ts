export interface Protocol {
  address: string;
  name: string;
  category: string;
  tvl: string;
  riskMetrics: {
    volatilityScore: number;
    liquidityScore: number;
    smartContractScore: number;
    governanceScore: number;
    overallRisk: number;
    lastUpdated: number;
    isActive: boolean;
  };
  isWhitelisted: boolean;
}

export interface Position {
  protocol: string;
  token: string;
  amount: string;
  value: string;
}

export interface PortfolioAnalysis {
  totalValue: string;
  overallRisk: number;
  diversificationScore: number;
  timestamp: number;
  isValid: boolean;
}

export interface NetworkInfo {
  name: string;
  chainId: number;
  blockNumber: number;
}
