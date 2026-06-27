import Redis from "ioredis";
import { env } from "../config/env";

const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;
