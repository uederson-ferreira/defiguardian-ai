import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { logger } from '../utils/logger';

export class InsuranceController {
  async getInsuranceStats(req: any, res: Response): Promise<void> {
    try {
      const stats = {
        totalPolicies: 150,
        totalCoverage: '50000000',
        averagePremium: '0.025',
        activeClaims: 3
      };

      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error in getInsuranceStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get insurance stats'
      });
    }
  }

  async getUserPolicies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const policies = [
        {
          id: 'policy-1',
          type: 'SMART_CONTRACT',
          coverage: '10000',
          premium: '0.02',
          status: 'ACTIVE'
        }
      ];

      res.json({
        success: true,
        data: policies
      });
      
    } catch (error) {
      logger.error('Error in getUserPolicies:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user policies'
      });
    }
  }

  async createPolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const policy = {
        id: `policy-${Date.now()}`,
        userId: req.user.id,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: policy
      });
      
    } catch (error) {
      logger.error('Error in createPolicy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create policy'
      });
    }
  }
}
