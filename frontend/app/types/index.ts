// types/index.ts
// DEFINIÇÕES DE TIPOS TYPESCRIPT PARA O PROJETO

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    image?: string;
    provider: string;
    walletAddress?: string;
    createdAt: string;
    updatedAt?: string;
  }
  
  export interface UserRecord {
    id: number;
    email: string;
    name: string;
    image?: string;
    provider: string;
    wallet_address?: string;
    created_at: string;
    updated_at: string;
  }
  
  // ============================================================================
  // PORTFOLIO TYPES
  // ============================================================================
  
  export interface PositionRecord {
    id: string;
    portfolio_id: string;
    protocol: string;
    token_symbol: string;
    value_usd: number;
    apy: number | null;
    risk_level: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface PortfolioRecord {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    wallet_address: string;
    total_value: number;
    risk_score: number;
    created_at: string;
    updated_at: string;
    positions?: PositionRecord[];
  }
  
  export interface PortfolioWithStats extends PortfolioRecord {
    calculated_total_value: number;
    average_apy: number;
    position_count: number;
  }
  
  export interface PortfolioData {
    riskScore: number;
    analysis: string;
    totalValue: string;
    positions: Array<{
      protocol: string;
      amount: string;
    }>;
    assetAllocation: {
      assets: string[];
      percentages: number[];
    };
  }
  
  // ============================================================================
  // ALERT TYPES
  // ============================================================================
  
  export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
  
  export interface AlertRecord {
    id: string;
    user_id: string;
    portfolio_id?: string;
    alert_type: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    is_read: boolean;
    is_dismissed: boolean;
    created_at: string;
    updated_at: string;
    portfolios?: {
      name: string;
      wallet_address: string;
    };
  }
  
  export interface AlertData {
    id: string;
    threshold: number;
    isActive: boolean;
    triggeredAt?: string;
    severity?: AlertSeverity;
    title?: string;
    message?: string;
  }
  
  export interface AlertStats {
    total: number;
    unread: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }
  
  // ============================================================================
  // INSURANCE TYPES
  // ============================================================================
  
  export interface InsurancePolicy {
    id: string;
    protocol: string;
    coverage: string;
    premium: string;
    isActive: boolean;
    createdAt?: string;
    expiresAt?: string;
  }
  
  export interface InsurancePolicyRecord {
    id: string;
    user_id: string;
    portfolio_id?: string;
    protocol_address: string;
    protocol_name: string;
    coverage_amount: number;
    premium_amount: number;
    is_active: boolean;
    created_at: string;
    expires_at?: string;
  }
  
  // ============================================================================
  // BLOCKCHAIN & WEB3 TYPES
  // ============================================================================
  
  export interface ContractAddresses {
    CONTRACT_REGISTRY: string;
    RISK_REGISTRY: string;
    RISK_ORACLE: string;
    PORTFOLIO_ANALYZER: string;
    ALERT_SYSTEM: string;
    RISK_GUARDIAN_MASTER: string;
    RISK_INSURANCE: string;
    STOP_LOSS_HEDGE: string;
    REBALANCE_HEDGE: string;
    VOLATILITY_HEDGE: string;
    CROSS_CHAIN_HEDGE: string;
  }
  
  export interface ChainConfig {
    chainId: number;
    chainName: string;
    rpcUrl: string;
    blockExplorer: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  }
  
  // ============================================================================
  // API RESPONSE TYPES
  // ============================================================================
  
  export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
  }
  
  export interface ApiErrorResponse {
    success: false;
    error: string;
    message?: string;
  }
  
  export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data?: T;
    message?: string;
  }
  
  // ============================================================================
  // COMPONENT PROP TYPES
  // ============================================================================
  
  export interface DashboardProps {
    user?: UserProfile | null;
    portfolios?: PortfolioWithStats[];
    alerts?: AlertData[];
    loading?: boolean;
  }
  
  export interface WalletConnectionProps {
    onConnect?: (address: string) => void;
    onDisconnect?: () => void;
    className?: string;
  }
  
  // ============================================================================
  // HOOK RETURN TYPES
  // ============================================================================
  
  export interface UseAuthReturn {
    user: UserProfile | null;
    profile: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (provider?: 'google' | 'github') => Promise<boolean>;
    logout: () => Promise<void>;
    updateWalletAddress: (address: string) => Promise<boolean>;
    refreshProfile: () => Promise<void>;
    status: string;
    supabase: unknown;
  }
  
  export interface UseDefiContractsReturn {
    isConnected: boolean;
    address: string | undefined;
    portfolioData: PortfolioData;
    alerts: AlertData[];
    insurancePolicies: InsurancePolicy[];
    marketRisk: number;
    loading: boolean;
    isTransactionPending: boolean;
    createAlert: (threshold: number) => Promise<void>;
    createInsurancePolicy: (protocol: string, coverage: string) => Promise<void>;
    transactionHash: string | undefined;
    transactionError: Error | null;
    isTransactionConfirmed: boolean;
    error: Error | null;
  }
  
  // ============================================================================
  // FORM TYPES
  // ============================================================================
  
  export interface CreatePortfolioForm {
    name: string;
    description?: string;
    walletAddress: string;
  }
  
  export interface CreateAlertForm {
    portfolioId?: string;
    alertType: string;
    severity: AlertSeverity;
    title: string;
    message: string;
  }
  
  export interface CreateInsuranceForm {
    portfolioId?: string;
    protocolAddress: string;
    protocolName: string;
    coverageAmount: number;
    premiumAmount: number;
  }
  
  // ============================================================================
  // UTILITY TYPES
  // ============================================================================
  
  export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
  export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
  
  // ============================================================================
  // EXPORT ALL TYPES
  // ============================================================================
  
  export type {
    // Re-export for convenience
    UserProfile as User,
    PortfolioRecord as Portfolio,
    AlertRecord as Alert,
    InsurancePolicy as Insurance,
  };