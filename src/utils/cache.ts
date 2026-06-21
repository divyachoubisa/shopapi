import redis from "../lib/redis";

export const CacheKeys = {
  products: (query: string) => `products:${query}`,
  product: (id: number) => `product:${id}`,
  categories: () => `products:categories`,
};

// TTL in seconds
export const CacheTTL = {
  products: 60 * 5, // 5 minutes
  product: 60 * 10, // 10 minutes
  categories: 60 * 60, // 1 hour
};

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (error) {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttl: number,
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (error) {}
}

export async function deleteCache(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await redis.del(...keys);
  } catch (error) {}
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (error) {}
}
