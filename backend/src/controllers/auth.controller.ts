import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth';

const nonceRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
});

const loginSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature format'),
  message: z.string().min(1, 'Message is required')
});

export class AuthController {
  async requestNonce(req: Request, res: Response): Promise<void> {
    try {
      const validation = nonceRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
        return;
      }

      const { address } = validation.data;
      
      logger.info(`🔑 Nonce requested for: ${address}`);
      
      const nonce = await authService.generateNonce(address);
      const message = authService.generateLoginMessage(address, nonce);

      res.json({
        success: true,
        data: {
          address,
          nonce,
          message
        },
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ Nonce provided for: ${address}`);
      
    } catch (error) {
      logger.error('Error in requestNonce:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate nonce',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid login data',
          details: validation.error.errors
        });
        return;
      }

      const loginData = validation.data;
      
      logger.info(`🔐 Login attempt for: ${loginData.address}`);
      
      const result = await authService.verifyAndLogin(loginData);

      const statusCode = result.success ? 200 : 401;
      res.status(statusCode).json(result);

      if (result.success) {
        logger.info(`✅ Login successful for: ${loginData.address}`);
      } else {
        logger.warn(`❌ Login failed for: ${loginData.address}`);
      }
      
    } catch (error) {
      logger.error('Error in login:', error);
      res.status(500).json({
        success: false,
        error: 'Login process failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      logger.error('Error in getProfile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }
  }
}

export const authController = new AuthController();
