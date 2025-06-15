import { Request, Response } from 'express';
import { blockchainService } from '../services/blockchain.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

export class RegistryController {
  
  async getAllProtocols(req: Request, res: Response): Promise<void> {
    try {
      logger.info('📋 API: Getting all protocols');
      
      const protocols = await blockchainService.getAllProtocols();
      
      res.json({
        success: true,
        data: protocols,
        count: protocols.length,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`✅ API: Returned ${protocols.length} protocols`);
      
    } catch (error) {
      logger.error('❌ API: Error in getAllProtocols:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch protocols',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProtocol(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      const validation = addressSchema.safeParse(address);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid protocol address format',
          details: validation.error.errors
        });
        return;
      }

      logger.info(`🔍 API: Getting protocol: ${address}`);
      
      const protocol = await blockchainService.getProtocol(address);
      
      if (!protocol) {
        res.status(404).json({
          success: false,
          error: 'Protocol not found',
          address
        });
        return;
      }

      res.json({
        success: true,
        data: protocol,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`✅ API: Returned protocol: ${protocol.name}`);
      
    } catch (error) {
      logger.error(`❌ API: Error in getProtocol:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch protocol',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProtocolRisk(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      const validation = addressSchema.safeParse(address);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid protocol address format'
        });
        return;
      }

      logger.info(`🎯 API: Getting risk for protocol: ${address}`);
      
      const protocol = await blockchainService.getProtocol(address);
      
      if (!protocol) {
        res.status(404).json({
          success: false,
          error: 'Protocol not found'
        });
        return;
      }

      const overallRisk = protocol.riskMetrics.overallRisk;
      let riskLevel: string;
      if (overallRisk < 3000) riskLevel = 'LOW';
      else if (overallRisk < 6000) riskLevel = 'MEDIUM';
      else if (overallRisk < 8000) riskLevel = 'HIGH';
      else riskLevel = 'CRITICAL';

      res.json({
        success: true,
        data: {
          address: protocol.address,
          name: protocol.name,
          category: protocol.category,
          riskMetrics: protocol.riskMetrics,
          riskLevel,
          riskPercentage: (overallRisk / 100).toFixed(2) + '%',
          lastUpdated: new Date(protocol.riskMetrics.lastUpdated * 1000).toISOString(),
          isActive: protocol.riskMetrics.isActive
        },
        timestamp: new Date().toISOString()
      });
      
      logger.info(`✅ API: Returned risk data for: ${protocol.name}`);
      
    } catch (error) {
      logger.error(`❌ API: Error in getProtocolRisk:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch protocol risk',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      logger.info('🏥 API: Checking system health');
      
      const blockchainHealthy = await blockchainService.healthCheck();
      const networkInfo = blockchainHealthy ? await blockchainService.getNetworkInfo() : null;
      
      const health = {
        status: blockchainHealthy ? 'healthy' : 'unhealthy',
        blockchain: {
          connected: blockchainHealthy,
          network: networkInfo?.name || 'disconnected',
          chainId: networkInfo?.chainId || null,
          blockNumber: networkInfo?.blockNumber || null
        },
        api: {
          status: 'healthy',
          version: '1.0.0',
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      };

      const statusCode = blockchainHealthy ? 200 : 503;
      
      res.status(statusCode).json({
        success: blockchainHealthy,
        data: health
      });
      
      logger.info(`✅ API: Health check completed - ${health.status}`);
      
    } catch (error) {
      logger.error('❌ API: Error in getSystemHealth:', error);
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
