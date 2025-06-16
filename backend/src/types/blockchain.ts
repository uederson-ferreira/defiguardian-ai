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

export interface RiskData {
  protocol: string;
  riskScore: number;
  timestamp: number;
  provider: string;
  data: any;
}

export interface InsurancePolicy {
  id: number;
  protocol: string;
  holder: string;
  amount: string;
  premium: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  isClaimed: boolean;
}

export interface InsurancePool {
  protocol: string;
  totalFunds: string;
  availableFunds: string;
  totalPolicies: number;
  riskFactor: number;
}

export interface Alert {
  id: number;
  user: string;
  protocol: string;
  threshold: number;
  condition: string;
  isActive: boolean;
  lastTriggered: number;
}
