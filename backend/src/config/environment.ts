import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8001'),
  apiPrefix: process.env.API_PREFIX || '/api',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/riskguardian',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Blockchain
  blockchain: {
    chainId: parseInt(process.env.SEPOLIA_CHAIN_ID || '11155111'),
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.drpc.org',
    riskOracleAddress: process.env.RISK_ORACLE_ADDRESS || '',
  },
  
  // Smart Contracts
  contracts: {
    riskRegistry: process.env.RISK_REGISTRY_ADDRESS || '',
    portfolioAnalyzer: process.env.PORTFOLIO_ANALYZER_ADDRESS || '',
    riskInsurance: process.env.RISK_INSURANCE_ADDRESS || '',
    alertSystem: process.env.ALERT_SYSTEM_ADDRESS || '',
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
