import dotenv from 'dotenv';
import { FUJI_CONTRACT_ADDRESSES, FUJI_NETWORK_CONFIG } from '../contracts/addresses/fuji-contracts';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8001'),
  apiPrefix: process.env.API_PREFIX || '/api',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/defiguardian',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Blockchain - Updated to Avalanche Fuji
  blockchain: {
    chainId: parseInt(process.env.FUJI_CHAIN_ID || FUJI_NETWORK_CONFIG.chainId.toString()),
    rpcUrl: process.env.FUJI_RPC_URL || FUJI_NETWORK_CONFIG.rpcUrl,
    riskOracleAddress: process.env.RISK_ORACLE_ADDRESS || FUJI_CONTRACT_ADDRESSES.RISK_ORACLE,
  },
  
  // Smart Contracts - Updated with Fuji addresses
  contracts: {
    riskRegistry: process.env.RISK_REGISTRY_ADDRESS || FUJI_CONTRACT_ADDRESSES.RISK_REGISTRY,
    portfolioAnalyzer: process.env.PORTFOLIO_ANALYZER_ADDRESS || FUJI_CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER,
    riskInsurance: process.env.RISK_INSURANCE_ADDRESS || FUJI_CONTRACT_ADDRESSES.RISK_INSURANCE,
    alertSystem: process.env.ALERT_SYSTEM_ADDRESS || FUJI_CONTRACT_ADDRESSES.ALERT_SYSTEM,
    contractRegistry: process.env.CONTRACT_REGISTRY_ADDRESS || FUJI_CONTRACT_ADDRESSES.CONTRACT_REGISTRY,
    riskGuardianMaster: process.env.RISK_GUARDIAN_MASTER_ADDRESS || FUJI_CONTRACT_ADDRESSES.RISK_GUARDIAN_MASTER,
  },
  
  // Auth - JWT expiresIn como string
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d', // string format
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8001'],
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/app.log',
};

export default config;
