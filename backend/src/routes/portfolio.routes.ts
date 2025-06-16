import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const portfolioController = new PortfolioController();

// All portfolio routes require authentication
router.get('/', authMiddleware, portfolioController.getUserPortfolios.bind(portfolioController));
router.post('/', authMiddleware, portfolioController.createPortfolio.bind(portfolioController));
router.get('/:portfolioId', authMiddleware, portfolioController.getPortfolio.bind(portfolioController));
router.put('/:portfolioId', authMiddleware, portfolioController.updatePortfolio.bind(portfolioController));
router.delete('/:portfolioId', authMiddleware, portfolioController.deletePortfolio.bind(portfolioController));
router.get('/:portfolioId/risk', authMiddleware, portfolioController.getPortfolioRisk.bind(portfolioController));

export { router as portfolioRoutes };
