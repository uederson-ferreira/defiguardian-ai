import { Router } from 'express';
import { InsuranceController } from '../controllers/insurance.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const insuranceController = new InsuranceController();

// Public routes
router.get('/stats', insuranceController.getInsuranceStats.bind(insuranceController));

// Protected routes
router.get('/', authMiddleware, insuranceController.getUserPolicies.bind(insuranceController));
router.post('/', authMiddleware, insuranceController.createPolicy.bind(insuranceController));

export { router as insuranceRoutes };