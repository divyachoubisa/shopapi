import redis from "../lib/redis";
export const CacheKeys = {
    products: (query) => `products:${query}`,
    product: (id) => `product:${id}`,
    categories: () => `products:categories`,
};
// TTL in seconds
export const CacheTTL = {
    products: 60 * 5, // 5 minutes
    product: 60 * 10, // 10 minutes
    categories: 60 * 60, // 1 hour
};
export async function getCache(key) {
    try {
        const cached = await redis.get(key);
        if (!cached)
            return null;
        return JSON.parse(cached);
    }
    catch (error) {
        return null;
    }
}
export async function setCache(key, value, ttl) {
    try {
        await redis.set(key, JSON.stringify(value), "EX", ttl);
    }
    catch (error) { }
}
export async function deleteCache(...keys) {
    try {
        if (keys.length > 0)
            await redis.del(...keys);
    }
    catch (error) { }
}
export async function deleteCachePattern(pattern) {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0)
            await redis.del(...keys);
    }
    catch (error) { }
}
