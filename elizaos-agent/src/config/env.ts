import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env-dev';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Required environment variables
const requiredEnvVars = [
  'ELIZAOS_API_KEY',
  'PORT',
  'NODE_ENV',
  'LOG_LEVEL',
  'CORS_ORIGIN',
  'ETHEREUM_RPC_URL',
  'POLYGON_RPC_URL',
  'BSC_RPC_URL',
  'AVALANCHE_RPC_URL',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS'
];

// Check for required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required configuration: ${missingEnvVars.join(', ')}`);
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // ElizaOS API
  elizaosApiKey: process.env.ELIZAOS_API_KEY,

  // Blockchain
  ethereum: {
    rpcUrl: process.env.ETHEREUM_RPC_URL
  },
  polygon: {
    rpcUrl: process.env.POLYGON_RPC_URL
  },
  bsc: {
    rpcUrl: process.env.BSC_RPC_URL
  },
  avalanche: {
    rpcUrl: process.env.AVALANCHE_RPC_URL
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '60', 10) // 1 minute
  }
}; 