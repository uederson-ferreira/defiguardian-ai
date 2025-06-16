import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/env';
import logger from '../config/logger';

interface ExtendedRequest extends Request {
  body: {
    contractAddress?: string;
  };
  query: {
    contractAddress?: string;
  };
}

// Configuração do rate limiter
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter específico para rotas de análise
export const analysisRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 análises por hora
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Analysis rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many analysis requests',
      message: 'Limite de análises excedido. Por favor, aguarde antes de fazer mais análises',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  keyGenerator: (req: ExtendedRequest): string => {
    // Usar IP + contractAddress como chave para limitar por contrato
    const contractAddress = req.body?.contractAddress || req.query?.contractAddress;
    return `${req.ip}-${contractAddress || 'default'}`;
  }
});

// Rate limiter específico para rotas de chat
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 mensagens por minuto
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Chat rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many chat messages',
      message: 'Limite de mensagens excedido. Por favor, aguarde antes de enviar mais mensagens',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  skip: (req: Request): boolean => {
    // Não aplicar limite para health check do chat
    return req.path === '/chat/health';
  },
  keyGenerator: (req: Request): string => {
    // Usar IP como chave para limitar por usuário
    return req.ip || 'unknown';
  }
}); 