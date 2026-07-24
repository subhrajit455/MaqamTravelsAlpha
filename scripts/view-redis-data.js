'use strict';

/**
 * scripts/view-redis-data.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A quick utility script to inspect and output all keys and their values
 * from the active Redis instance.
 */

require('dotenv').config();
const Redis = require('ioredis');

if (!process.env.REDIS_URL) {
  console.error('Error: REDIS_URL is not defined in your .env file.');
  process.exit(1);
}

async function inspectRedis() {
  const redis = new Redis(process.env.REDIS_URL);
  
  console.log(`Connecting to Redis: ${process.env.REDIS_URL.split('@')[1] || process.env.REDIS_URL}\n`);

  try {
    const keys = await redis.keys('*');
    if (keys.length === 0) {
      console.log('No keys found in the Redis database.');
      redis.disconnect();
      return;
    }

    console.log(`Found ${keys.length} keys in Redis:\n`);
    console.log('--------------------------------------------------');

    for (const key of keys) {
      const type = await redis.type(key);
      let value = '';

      switch (type) {
        case 'string':
          value = await redis.get(key);
          break;
        case 'hash':
          const hashData = await redis.hgetall(key);
          value = JSON.stringify(hashData, null, 2);
          break;
        case 'list':
          const listData = await redis.lrange(key, 0, -1);
          value = JSON.stringify(listData);
          break;
        case 'set':
          const setData = await redis.smembers(key);
          value = JSON.stringify(setData);
          break;
        case 'zset':
          const zsetData = await redis.zrange(key, 0, -1, 'WITHSCORES');
          value = JSON.stringify(zsetData);
          break;
        default:
          value = `[Unsupported Type: ${type}]`;
      }

      console.log(`🔑 Key:  ${key}`);
      console.log(`📁 Type: ${type}`);
      console.log(`📄 Value:`);
      console.log(value);
      console.log('--------------------------------------------------');
    }
  } catch (err) {
    console.error('Error fetching Redis data:', err.message);
  } finally {
    redis.disconnect();
  }
}

inspectRedis();
