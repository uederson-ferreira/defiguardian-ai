import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { routes } from './routes';
import { blockchainService } from './services/blockchain.service';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 900000,
  max: 100,
  message: { error: 'Too many requests from this IP' }
});
app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', { 
  stream: { 
    write: (message: string) => logger.info(message.trim()) 
  } 
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'RiskGuardian AI Backend API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/health'
  });
});

// API routes
app.use(config.apiPrefix, routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize blockchain connection
async function initializeApp() {
  try {
    await blockchainService.connect();
    logger.info('🔗 Blockchain service connected');
  } catch (error) {
    logger.error('Failed to connect blockchain service:', error);
  }
}

const server = app.listen(config.port, () => {
  logger.info(`🚀 RiskGuardian API running on port ${config.port}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Blockchain: Sepolia (${config.sepoliaChainId})`);
  logger.info(`📄 Health check: http://localhost:${config.port}/health`);
  
  initializeApp();
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
