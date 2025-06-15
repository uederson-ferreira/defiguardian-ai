import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000'),
  apiPrefix: process.env.API_PREFIX || '/api',
  
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  
  // Blockchain
  sepoliaChainId: parseInt(process.env.SEPOLIA_CHAIN_ID || '11155111'),
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL!,
  
  // Smart Contracts (SEUS ENDEREÇOS)
  contracts: {
    riskRegistry: process.env.RISK_REGISTRY_ADDRESS!,
    riskOracle: process.env.RISK_ORACLE_ADDRESS!,
    portfolioAnalyzer: process.env.PORTFOLIO_ANALYZER_ADDRESS!,
    riskInsurance: process.env.RISK_INSURANCE_ADDRESS!,
    alertSystem: process.env.ALERT_SYSTEM_ADDRESS!,
  },
  
  // Auth
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/app.log',
};

// Validation
const requiredEnvVars = [
  'DATABASE_URL',
  'SEPOLIA_RPC_URL',
  'RISK_REGISTRY_ADDRESS',
  'PORTFOLIO_ANALYZER_ADDRESS',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}