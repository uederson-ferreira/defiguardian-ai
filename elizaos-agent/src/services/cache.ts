import NodeCache from 'node-cache';
import logger from '../config/logger';
import { config } from '../config/env';

const cache = new NodeCache({
  stdTTL: config.cache?.ttl || 300, // 5 minutes
  checkperiod: config.cache?.checkPeriod || 60 // 1 minute
});

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: number;
}

class CacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    keys: 0,
    memory: 0
  };

  constructor() {
    // Update stats periodically
    setInterval(() => {
      this.updateStats();
    }, 60000);

    logger.info('Cache service initialized', {
      ttl: config.cache?.ttl || 300,
      checkPeriod: config.cache?.checkPeriod || 60
    });
  }

  private updateStats(): void {
    const keys = cache.keys();
    this.stats.keys = keys.length;
    this.stats.memory = process.memoryUsage().heapUsed;

    logger.debug('Cache stats updated', {
      ...this.stats,
      timestamp: new Date().toISOString()
    });
  }

  public get<T>(key: string): T | undefined {
    const value = cache.get<T>(key);
    if (value === undefined) {
      this.stats.misses++;
      logger.debug('Cache miss', { key });
    } else {
      this.stats.hits++;
      logger.debug('Cache hit', { key });
    }
    return value;
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    const success = cache.set(key, value, ttl || config.cache?.ttl || 300);
    logger.debug('Cache set', { key, ttl, success });
    return success;
  }

  public del(key: string): number {
    const deleted = cache.del(key);
    logger.debug('Cache delete', { key, deleted });
    return deleted;
  }

  public flush(): void {
    cache.flushAll();
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      memory: 0
    };
    logger.info('Cache flushed');
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }
}

export const cacheService = new CacheService(); 