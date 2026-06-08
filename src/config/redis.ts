import { createClient } from "redis";
import config from "./config";

const redisClient = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

let connectPromise: Promise<typeof redisClient> | null = null;

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

export async function connectRedis(): Promise<typeof redisClient | null> {
  if (redisClient.isReady) return redisClient;

  if (!connectPromise) {
    connectPromise = redisClient.connect().catch((error) => {
      connectPromise = null;
      console.error("Redis connection failed:", error);
      return null as never;
    });
  }

  return connectPromise;
}

export async function getRedisClient(): Promise<typeof redisClient | null> {
  try {
    await connectRedis();
    return redisClient.isReady ? redisClient : null;
  } catch {
    return null;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
}

export default redisClient;
