import { Request, Response } from 'express';
import { blockchainService } from '../services/blockchain.service';
import { logger } from '../utils/logger';

export class RegistryController {
  async getAllProtocols(req: Request, res: Response): Promise<void> {
    try {
      logger.info('�� Getting all protocols');
      
      // Mock data para desenvolvimento
      const protocols = [
        {
          address: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
          name: 'Uniswap V3',
          category: 'DEX',
          riskScore: 4200,
          tvl: '1000000000',
          lastAudit: new Date().toISOString()
        },
        {
          address: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
          name: 'Aave V3',
          category: 'Lending',
          riskScore: 3800,
          tvl: '2000000000',
          lastAudit: new Date().toISOString()
        }
      ];

      res.json({
        success: true,
        data: protocols,
        count: protocols.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error in getAllProtocols:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get protocols'
      });
    }
  }

  async getProtocol(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      logger.info(`🔍 Getting protocol: ${address}`);
      
      const protocol = await blockchainService.getProtocol(address);
      
      res.json({
        success: true,
        data: protocol,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error in getProtocol:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get protocol'
      });
    }
  }

  async getProtocolRisk(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      logger.info(`📊 Getting protocol risk: ${address}`);
      
      const riskScore = await blockchainService.getRiskScore(address);
      
      res.json({
        success: true,
        data: {
          address,
          riskScore,
          riskLevel: riskScore < 3000 ? 'LOW' : riskScore < 6000 ? 'MEDIUM' : 'HIGH'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error in getProtocolRisk:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get protocol risk'
      });
    }
  }

  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        blockchain: blockchainService.isHealthy(),
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: health
      });
      
    } catch (error) {
      logger.error('Error in getSystemHealth:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system health'
      });
    }
  }
}