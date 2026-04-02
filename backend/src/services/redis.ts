import { createClient } from 'redis';
import { config } from '../config/index.js';
import { logger } from './logger.js'

const redisClient = createClient({ url: config.REDIS_URL });

redisClient.on('error', (error) => {
  logger.error('Redis error', error);
});

export const cache = {
  async connect() {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      const pong = await redisClient.ping();
      if (pong === 'PONG') {
        logger.info('Redis connected');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Redis connection failed', error);
      return false;
    }
  },

  async ping() {
    try {
      if (!redisClient.isOpen) return false;
      const pong = await redisClient.ping();
      return pong === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed', error);
      return false;
    }
  },

  async close() {
    try {
      if (redisClient.isOpen) {
        await redisClient.disconnect();
        logger.info('Redis disconnected');
      }
    } catch (error) {
      logger.error('Redis disconnect error', error);
    }
  },

  client: redisClient,
};
