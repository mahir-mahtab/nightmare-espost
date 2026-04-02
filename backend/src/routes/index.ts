import { Router } from 'express';
import { db } from '../services/database.js';
import { cache } from '../services/redis.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const postgresOk = await db.ping();
  const redisOk = await cache.ping();
  const status = postgresOk && redisOk ? 'ok' : 'degraded';

  res.status(postgresOk && redisOk ? 200 : 503).json({
    status,
    service: 'esports-backend',
    dependencies: {
      postgres: postgresOk,
      redis: redisOk,
    },
  });
});

router.get('/ping', async (_req, res) => {
  const postgresOk = await db.ping();
  const redisOk = await cache.ping();
  const status = postgresOk && redisOk ? 'ok' : 'degraded';

  res.status(postgresOk && redisOk ? 200 : 503).json({
    status,
    postgres: postgresOk,
    redis: redisOk,
  });
});

export default router;
