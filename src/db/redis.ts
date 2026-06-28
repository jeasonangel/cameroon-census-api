import Redis from 'ioredis';
import { config } from '../config/index.js';  // ← Go up one level to src/config

let redis: Redis | null = null;
let isRedisAvailable = false;

// Only try to connect if Redis URL is configured
if (config.redisUrl) {
  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️ Redis connection failed after 3 retries, continuing without Redis');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

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

    setTimeout(() => {
      if (!isRedisAvailable) {
        console.warn('ℹ️ Redis not available, running in degraded mode without caching');
      }
    }, 5000);

  } catch (error) {
    console.warn('⚠️ Redis initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    redis = null;
    isRedisAvailable = false;
  }
} else {
  console.log('ℹ️ Redis not configured, running without Redis');
}

function checkRedis(): boolean {
  return !!redis && isRedisAvailable;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!checkRedis()) {
    return null;
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
    return;
  }
  
  try {
    await redis!.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    console.warn('Redis cache set failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  if (!checkRedis()) {
    return;
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
  }
}

export { redis, isRedisAvailable };

export const CACHE_TTL = {
  GEOGRAPHY: 60 * 60 * 24, // 24h
  DATA: 60 * 60, // 1h
};