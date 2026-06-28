// src/db/redis.ts
import Redis from 'ioredis';
import { config } from '../config/index.js';

let redis: Redis | null = null;

// Only create Redis connection if URL is provided
if (config.redisUrl) {
  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.log('❌ Redis: Max retries reached, stopping retry');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redis.on('error', (err: Error) => {
      console.error('❌ Redis error:', err.message);
    });
  } catch (error) {
    console.warn('⚠️ Redis connection failed, continuing without cache');
    redis = null;
  }
} else {
  console.log('ℹ️ Redis not configured, running without cache');
}

// ─── CACHE FUNCTIONS ───

// Cache TTL in seconds (5 minutes default)
export const CACHE_TTL = 300;

/**
 * Get cached data
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function cacheSet<T = any>(
  key: string, 
  data: T, 
  ttl: number = CACHE_TTL
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete cached data
 */
export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Invalidate cache by pattern
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Clear all cache
 */
export async function cacheClear(): Promise<void> {
  if (!redis) return;
  try {
    await redis.flushall();
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

export { redis };