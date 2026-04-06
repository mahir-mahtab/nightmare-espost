// ============================================================================
// API Routes Index
// ============================================================================

import { Router } from 'express';
import { db } from '../services/database.js';
import { cache } from '../services/redis.js';

// Import route modules
import adminRoutes from './admin.js';
import eventsRoutes from './events.js';
import playersRoutes from './players.js';
import teamsRoutes from './teams.js';
import auctionRoutes from './auction.js';
import achievementsRoutes from './achievements.js';
import creatorsRoutes from './creators.js';
import settingsRoutes from './settings.js';
import publicRoutes from './public.js';

const router = Router();

// ============================================================================
// Health Check Endpoints
// ============================================================================

router.get('/health', async (_req, res) => {
  const postgresOk = await db.ping();
  const redisOk = await cache.ping();
  const status = postgresOk && redisOk ? 'ok' : 'degraded';

  res.status(postgresOk && redisOk ? 200 : 503).json({
    status,
    service: 'esports-backend',
    timestamp: new Date().toISOString(),
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

// ============================================================================
// API Routes
// ============================================================================

// Public endpoints (no auth required)
router.use('/api/public', publicRoutes);

// Admin authentication
router.use('/api/admin', adminRoutes);

// Organization settings and rosters
router.use('/api/settings', settingsRoutes);
router.use('/api', settingsRoutes); // For /api/rosters

// Achievements
router.use('/api/achievements', achievementsRoutes);

// Content Creators
router.use('/api/creators', creatorsRoutes);

// Events
router.use('/api/events', eventsRoutes);

// Players (nested under events)
router.use('/api/events/:eventId/players', playersRoutes);

// Teams (nested under events)
router.use('/api/events/:eventId/teams', teamsRoutes);

// Auction (nested under events)
router.use('/api/events/:eventId/auction', auctionRoutes);

export default router;
