// elizaos-agent/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env';
import { setupLogging } from './config/logger';
import { setupRateLimit } from './config/rate-limit';
import routes from './routes';
import { createServer } from 'http';
import { createWebSocketService } from './services/websocket';
import { aiAgentService } from './services/ai-agent';

// Initialize logger
const logger = setupLogging();

// Create Express app
const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(setupRateLimit());

// Initialize WebSocket
createWebSocketService(server);

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Portfolio analysis endpoint
app.post('/api/analyze-portfolio', async (req, res) => {
  try {
    const { address, context } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const analysis = await aiAgentService.analyzePortfolio(address, context);
    return res.json(analysis);
  } catch (error) {
    logger.error('Portfolio analysis failed:', error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
});

// Error handling
app.use((_err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', _err);
  return res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// Start server
server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});