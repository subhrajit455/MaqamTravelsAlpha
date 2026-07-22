// utils/cache.js
// Redis-backed cache with an in-memory fallback so the app keeps working
// even if Redis is unavailable at startup.
const { createClient } = require("redis");
const dotenv = require("dotenv");
const logger = require("./logger");

dotenv.config();

const memoryStore = new Map();
let redisClient = null;
let redisReady = false;
let redisConnectPromise = null;

const connectRedis = async () => {
  if (redisClient) return redisClient;
  if (redisConnectPromise) return redisConnectPromise;

  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  redisClient = createClient({
    url,
    socket: {
      connectTimeout: 1000,
    },
  });

  redisClient.on("error", (err) => {
    redisReady = false;
    logger.warn(`Redis unavailable, using memory fallback: ${err.message}`);
  });

  redisConnectPromise = redisClient.connect().then(() => {
    redisReady = true;
    logger.info(`Redis connected at ${url}`);
    return redisClient;
  }).catch((err) => {
    redisReady = false;
    logger.warn(`Redis connection failed, using memory fallback: ${err.message}`);
    return null;
  });

  return redisConnectPromise;
};

const set = async (key, value, ttlMs) => {
  const expiresAt = Date.now() + ttlMs;
  memoryStore.set(key, { value, expiresAt });

  const client = await connectRedis();
  if (!client || !redisReady) return;

  try {
    await client.set(key, JSON.stringify({ value, expiresAt }), { PX: ttlMs });
  } catch (err) {
    logger.warn(`Redis set failed for ${key}: ${err.message}`);
  }
};

const get = async (key) => {
  const now = Date.now();
  const memoryEntry = memoryStore.get(key);
  if (memoryEntry) {
    if (now > memoryEntry.expiresAt) {
      memoryStore.delete(key);
    } else {
      return memoryEntry.value;
    }
  }

  const client = await connectRedis();
  if (!client || !redisReady) return null;

  try {
    const raw = await client.get(key);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    if (now > payload.expiresAt) {
      await client.del(key);
      return null;
    }

    memoryStore.set(key, payload);
    return payload.value;
  } catch (err) {
    logger.warn(`Redis get failed for ${key}: ${err.message}`);
    return null;
  }
};

module.exports = { set, get };