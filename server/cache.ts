import NodeCache from 'node-cache';
import logger from './logger';

// Create cache instance with configuration
// stdTTL: default time to live in seconds (5 minutes)
// checkperiod: automatic cleanup interval in seconds (10 minutes)
// useClones: false for better performance (be careful with object mutations)
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 600, // 10 minutes
  useClones: false,
  deleteOnExpire: true,
});

// Cache statistics for monitoring
cache.on('set', (key) => {
  logger.debug(`Cache SET: ${key}`);
});

cache.on('expired', (key) => {
  logger.debug(`Cache EXPIRED: ${key}`);
});

cache.on('del', (key) => {
  logger.debug(`Cache DEL: ${key}`);
});

/**
 * Get value from cache
 */
export function get<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * Set value in cache with optional TTL
 */
export function set<T>(key: string, value: T, ttl?: number): boolean {
  return cache.set(key, value, ttl || 300);
}

/**
 * Delete key from cache
 */
export function del(key: string | string[]): number {
  return cache.del(key);
}

/**
 * Clear all cache
 */
export function flush(): void {
  cache.flushAll();
  logger.info('Cache flushed');
}

/**
 * Get cache statistics
 */
export function getStats() {
  return cache.getStats();
}

/**
 * Cache wrapper function for async operations
 * Automatically handles cache get/set logic
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try to get from cache first
  const cachedValue = get<T>(key);
  if (cachedValue !== undefined) {
    logger.debug(`Cache HIT: ${key}`);
    return cachedValue;
  }

  // Cache miss - fetch fresh data
  logger.debug(`Cache MISS: ${key}`);
  const freshValue = await fetcher();

  // Store in cache
  set(key, freshValue, ttl);

  return freshValue;
}

/**
 * Invalidate cache by pattern
 * Useful for clearing related cache entries
 */
export function invalidatePattern(pattern: string): number {
  const keys = cache.keys().filter((key) => key.includes(pattern));
  return del(keys);
}

export default {
  get,
  set,
  del,
  flush,
  getStats,
  cached,
  invalidatePattern,
};
