import Redis from 'ioredis';
import { config } from '../config';

// Check if Redis URL is valid and not localhost fallback
const isRedisConfigured = config.redisUrl && config.redisUrl !== 'redis://localhost:6379';

let redis: Redis | null = null;
let isRedisAvailable = false;

if (isRedisConfigured) {
  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: true, // Don't connect immediately
      retryStrategy: (times) => {
        // Only retry a few times, then give up
        if (times > 3) {
          console.warn('⚠️ Redis connection failed after 3 retries, continuing without Redis');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    // Handle connection events
    redis.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
      isRedisAvailable = false;
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    redis.on('ready', () => {
      isRedisAvailable = true;
    });

    // Try to connect
    redis.connect().catch(() => {
      console.warn('⚠️ Redis connection failed, continuing without Redis');
      isRedisAvailable = false;
    });

    // Set a timeout - if Redis doesn't connect in 5 seconds, continue without it
    setTimeout(() => {
      if (!isRedisAvailable) {
        console.warn('ℹ️ Redis not available, running in degraded mode without caching');
        // Don't kill the app - just log and continue
      }
    }, 5000);

  } catch (error) {
    console.warn('⚠️ Redis initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    redis = null;
    isRedisAvailable = false;
  }
} else {
  console.log('ℹ️ Redis not configured (using localhost fallback), running without Redis');
}

// Helper function to check if Redis is available
function checkRedis(): boolean {
  if (!redis || !isRedisAvailable) {
    return false;
  }
  return true;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!checkRedis()) {
    return null; // Skip cache if Redis is not available
  }
  
  try {
    const val = await redis!.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch (error) {
    console.warn('Redis cache get failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!checkRedis()) {
    return; // Skip cache if Redis is not available
  }
  
  try {
    await redis!.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    console.warn('Redis cache set failed:', error instanceof Error ? error.message : 'Unknown error');
    // ignore cache failures
  }
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  if (!checkRedis()) {
    return; // Skip cache invalidation if Redis is not available
  }
  
  try {
    const stream = redis!.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];
    for await (const chunk of stream) {
      keys.push(...(chunk as string[]));
    }
    if (keys.length) await redis!.del(keys);
  } catch (error) {
    console.warn('Redis cache invalidation failed:', error instanceof Error ? error.message : 'Unknown error');
    // ignore
  }
}

export { redis, isRedisAvailable };

export const CACHE_TTL = {
  GEOGRAPHY: 60 * 60 * 24, // 24h
  DATA: 60 * 60, // 1h
};