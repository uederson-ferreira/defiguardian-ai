import { Router, Request, Response } from 'express';
import { elizaosService } from '../services/elizaos';
import { blockchainService } from '../services/blockchain';
import { cacheService } from '../services/cache';

const router = Router();

// Health check
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const elizaosHealth = await elizaosService.healthCheck();
    res.json({ status: 'ok', elizaos: elizaosHealth });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Analyze contract
router.post('/analyze-contract', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contractAddress } = req.body;
    if (!contractAddress) {
      res.status(400).json({ status: 'error', message: 'Contract address is required' });
      return;
    }

    // Check cache first
    const cachedResult = cacheService.get(`contract:${contractAddress}`);
    if (cachedResult) {
      res.json(cachedResult);
      return;
    }

    // Get analysis from ElizaOS
    const analysis = await elizaosService.analyzeContract(contractAddress);
    
    // Cache the result
    cacheService.set(`contract:${contractAddress}`, analysis);
    
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Monitor market
router.post('/monitor-market', async (req: Request, res: Response): Promise<void> => {
  try {
    const { assets } = req.body;
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      res.status(400).json({ status: 'error', message: 'Assets array is required' });
      return;
    }

    // Check cache first
    const cacheKey = `market:${assets.sort().join(',')}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      res.json(cachedResult);
      return;
    }

    // Get market data from ElizaOS
    const marketData = await elizaosService.monitorMarket(assets);
    
    // Cache the result for 1 minute (market data is more volatile)
    cacheService.set(cacheKey, marketData, 60);
    
    res.json(marketData);
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get balances
router.get('/balances/:address', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    
    // Check cache first
    const cachedResult = cacheService.get(`balances:${address}`);
    if (cachedResult) {
      res.json(cachedResult);
      return;
    }

    // Get balances from different chains
    const [ethereum, polygon, bsc, avalanche] = await Promise.all([
      blockchainService.getEthereumBalance(address),
      blockchainService.getPolygonBalance(address),
      blockchainService.getBscBalance(address),
      blockchainService.getAvalancheBalance(address)
    ]);

    const balances = {
      ethereum,
      polygon,
      bsc,
      avalanche
    };

    // Cache the result
    cacheService.set(`balances:${address}`, balances);

    res.json(balances);
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router; 