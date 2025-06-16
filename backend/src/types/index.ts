// Express Request extensions
declare global {
    namespace Express {
      interface Request {
        user?: {
          id: string;
          address: string;
        };
      }
    }
  }
  
  // API Response types
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string;
  }
  
  export interface PaginatedResponse<T = any> extends ApiResponse<T> {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  // Authentication types
  export interface LoginRequest {
    address: string;
    signature: string;
    message: string;
  }
  
  export interface NonceRequest {
    address: string;
  }
  
  export interface AuthResponse {
    user: {
      id: string;
      address: string;
    };
    token: string;
    tokenType: string;
  }
  
  // Insurance types
  export interface CreatePolicyRequest {
    policyType: string;
    coverageAmount: string;
    duration: number;
    protocolAddress?: string;
  }
  
  export interface CreateClaimRequest {
    policyId: string;
    claimType: string;
    amount: string;
    description?: string;
    evidence?: any;
  }
  
  // Risk Assessment types
  export interface RiskAssessmentData {
    userAddress: string;
    protocolAddress?: string;
    riskScore: number;
    volatilityScore?: number;
    liquidityScore?: number;
    auditScore?: number;
    factors: RiskFactor[];
  }
  
  export interface RiskFactor {
    type: string;
    score: number;
    weight: number;
    description: string;
  }
  
  // Blockchain types
  export interface TransactionData {
    hash: string;
    blockNumber: number;
    gasUsed: string;
    status: 'success' | 'failed' | 'pending';
  }
  
  export interface SmartContractEvent {
    eventName: string;
    blockNumber: number;
    transactionHash: string;
    args: any;
    timestamp: Date;
  }
  
  // Error types
  export interface ValidationError {
    field: string;
    message: string;
    value?: any;
  }
  
  export interface ApiError extends Error {
    statusCode: number;
    details?: ValidationError[];
  }
  
  // Utility types
  export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
  export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
  
  // Database model types (extending Prisma types)
  export interface UserWithPolicies {
    id: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
    insurancePolicies: PolicyWithClaims[];
  }
  
  export interface PolicyWithClaims {
    id: string;
    userAddress: string;
    policyType: string;
    coverageAmount: string;
    premium: string;
    duration: number;
    status: string;
    riskScore?: number;
    startDate: Date;
    endDate: Date;
    contractAddress?: string;
    transactionHash?: string;
    claims: ClaimData[];
  }
  
  export interface ClaimData {
    id: string;
    policyId: string;
    claimType: string;
    amount: string;
    description?: string;
    evidence?: string;
    status: string;
    submittedAt: Date;
    processedAt?: Date;
    approvedAmount?: string;
    rejectionReason?: string;
    transactionHash?: string;
  }
  
  // WebSocket message types
  export interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: Date;
    userId?: string;
  }
  
  export interface NotificationMessage extends WebSocketMessage {
    type: 'notification';
    payload: {
      title: string;
      message: string;
      level: 'info' | 'warning' | 'error' | 'success';
      actionUrl?: string;
    };
  }
  
  export interface RiskAlertMessage extends WebSocketMessage {
    type: 'risk_alert';
    payload: {
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      protocolAddress: string;
      message: string;
      recommendedAction: string;
    };
  }
  
  // Configuration types
  export interface AppConfig {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    ethereumRpcUrl: string;
    redisUrl: string;
  }
  
  export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  }
  
  // Export everything as a module
  export {};