import { logger } from '../utils/logger';

export class CacheService {
  private cache: Map<string, { data: any; expires: number }>;
  private isConnected: boolean = false;

  constructor() {
    this.cache = new Map();
  }

  async connect(): Promise<void> {
    try {
      // For now, we'll use in-memory cache
      // In production, this would connect to Redis
      this.isConnected = true;
      logger.info('📋 Cache service connected (in-memory)');
    } catch (error) {
      logger.error('Failed to connect to cache:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;

      const item = this.cache.get(key);
      if (!item) return null;

      // Check if expired
      if (Date.now() > item.expires) {
        this.cache.delete(key);
        return null;
      }

      return item.data as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      if (!this.isConnected) return;

      const expires = Date.now() + (ttlSeconds * 1000);
      this.cache.set(key, { data: value, expires });
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      this.cache.delete(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const item = this.cache.get(key);
      if (!item) return false;

      // Check if expired
      if (Date.now() > item.expires) {
        this.cache.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    try {
      this.cache.clear();
      this.isConnected = false;
      logger.info('📋 Cache service disconnected');
    } catch (error) {
      logger.error('Error disconnecting cache:', error);
    }
  }
}

export const cacheService = new CacheService();
