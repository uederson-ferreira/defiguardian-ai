import rateLimit from 'express-rate-limit';
import { config } from './env';

export const setupRateLimit = () => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.'
    }
  });
}; 