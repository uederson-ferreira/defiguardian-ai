import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/auth';

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const user = await authService.getUserById(decoded.userId);
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid token - user not found'
        });
        return;
      }

      req.user = {
        id: user.id,
        address: user.address
      };

      next();
      
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }
    
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
    return;
  }
};
