import { Router } from 'express';
import { RegistryController } from '../controllers/registry.controller';

const router = Router();
const registryController = new RegistryController();

// Fix: Use async wrapper functions instead of bind
router.get('/protocols', async (req, res) => {
  await registryController.getAllProtocols(req, res);
});

router.get('/protocols/:address', async (req, res) => {
  await registryController.getProtocol(req, res);
});

router.get('/protocols/:address/risk', async (req, res) => {
  await registryController.getProtocolRisk(req, res);
});

router.get('/health', async (req, res) => {
  await registryController.getSystemHealth(req, res);
});

export { router as registryRoutes };
