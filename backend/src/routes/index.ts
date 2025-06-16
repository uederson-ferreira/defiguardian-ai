import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { registryRoutes } from './registry.routes';
import { portfolioRoutes } from './portfolio.routes';
import { insuranceRoutes } from './insurance.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RiskGuardian API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/registry', registryRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/insurance', insuranceRoutes);

export default router;
