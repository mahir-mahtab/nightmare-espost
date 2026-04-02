import { Client as PgClient } from 'pg';
import { config } from '../config/index.js';
import { logger } from './logger.js';

const pgClient = new PgClient({
  host: config.POSTGRES_HOST,
  port: config.POSTGRES_PORT,
  database: config.POSTGRES_DB,
  user: config.POSTGRES_USER,
  password: config.POSTGRES_PASSWORD,
});

let isConnected = false;

export const db = {
  async connect() {
    try {
      if (!isConnected) {
        await pgClient.connect();
        await pgClient.query('SELECT 1');
        isConnected = true;
        logger.info('PostgreSQL connected');
      }
      return true;
    } catch (error) {
      logger.error('PostgreSQL connection failed', error);
      return false;
    }
  },

  async ping() {
    try {
      if (!isConnected) return false;
      await pgClient.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('PostgreSQL ping failed', error);
      return false;
    }
  },

  async close() {
    try {
      if (isConnected) {
        await pgClient.end();
        isConnected = false;
        logger.info('PostgreSQL disconnected');
      }
    } catch (error) {
      logger.error('PostgreSQL disconnect error', error);
    }
  },

  client: pgClient,
};
