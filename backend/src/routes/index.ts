import { Router } from 'express';
import { registryRoutes } from './registry.routes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RiskGuardian API is running',
    timestamp: new Date().toISOString()
  });
});

router.use('/registry', registryRoutes);

export { router as routes };
