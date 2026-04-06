// ============================================================================
// Public API Routes (No Authentication Required)
// ============================================================================

import { Router, Request, Response } from 'express';
import { queryOne, queryAll } from '../utils/db.js';
import { logger } from '../services/logger.js';
import type { 
  Event, EventWithStats, Achievement, ContentCreator, OrgRoster, OrgSettings,
  EventPrizeStructure, EventInvitedTeam, EventPartner, TeamResponse, PlayerResponse
} from '../types/index.js';

const router = Router();

// ============================================================================
// Public Settings
// ============================================================================

/**
 * GET /api/public/settings
 * Get public organization info
 */
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await queryOne<OrgSettings>('SELECT * FROM org_settings LIMIT 1');

    const data = settings ? {
      name: settings.name,
      location: settings.location,
      focus: settings.focus,
      services: settings.services,
      expansion: settings.expansion,
      partnerships: settings.partnerships,
      social: {
        facebook: settings.facebook_url,
        youtube: settings.youtube_url,
        discord: settings.discord_url,
        website: settings.website_url,
      },
    } : {
      name: 'Nightmare Esports',
      location: 'Bangladesh',
      focus: 'PUBG Mobile',
      services: ['Tournament Operations', 'Team Management', 'Talent Development'],
      expansion: 'Multiple game titles planned',
      partnerships: 'Open for sponsorships and strategic partnerships',
      social: {},
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Get public settings error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings',
    });
  }
});

// ============================================================================
// Public Rosters
// ============================================================================

/**
 * GET /api/public/rosters
 * Get active organization rosters
 */
router.get('/rosters', async (_req: Request, res: Response) => {
  try {
    const rosters = await queryAll<OrgRoster>(
      'SELECT * FROM org_rosters WHERE status = $1 ORDER BY sort_order ASC',
      ['active']
    );

    res.json({
      success: true,
      data: { rosters },
    });
  } catch (error) {
    logger.error('Get public rosters error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rosters',
    });
  }
});

// ============================================================================
// Public Achievements
// ============================================================================

/**
 * GET /api/public/achievements
 * Get all achievements
 */
router.get('/achievements', async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    const achievements = await queryAll<Achievement>(`
      SELECT * FROM achievements 
      ORDER BY sort_order ASC, event_date DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: { achievements },
    });
  } catch (error) {
    logger.error('Get public achievements error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievements',
    });
  }
});

// ============================================================================
// Public Content Creators
// ============================================================================

/**
 * GET /api/public/creators
 * Get active content creators
 */
router.get('/creators', async (req: Request, res: Response) => {
  try {
    const { featured } = req.query;

    let whereClause = 'WHERE is_active = TRUE';
    const params: unknown[] = [];

    if (featured === 'true') {
      whereClause += ' AND is_featured = TRUE';
    }

    const creators = await queryAll<ContentCreator>(`
      SELECT * FROM content_creators 
      ${whereClause}
      ORDER BY sort_order ASC, name ASC
    `, params);

    res.json({
      success: true,
      data: { creators },
    });
  } catch (error) {
    logger.error('Get public creators error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content creators',
    });
  }
});

// ============================================================================
// Public Events
// ============================================================================

/**
 * GET /api/public/events
 * Get published events
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { status, game, upcoming, limit = 20 } = req.query;

    const conditions: string[] = ['is_published = TRUE'];
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (game) {
      params.push(game);
      conditions.push(`game = $${params.length}`);
    }

    if (upcoming === 'true') {
      conditions.push('start_date > CURRENT_TIMESTAMP');
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    params.push(limit);

    const events = await queryAll<EventWithStats>(`
      SELECT e.*, es.team_count, es.player_count
      FROM events e
      LEFT JOIN event_statistics es ON e.id = es.event_id
      ${whereClause}
      ORDER BY e.start_date DESC
      LIMIT $${params.length}
    `, params);

    res.json({
      success: true,
      data: { events },
    });
  } catch (error) {
    logger.error('Get public events error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get events',
    });
  }
});

/**
 * GET /api/public/events/:eventId
 * Get published event details
 */
router.get('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await queryOne<EventWithStats>(`
      SELECT e.*, es.team_count, es.player_count, es.sold_player_count, es.available_player_count
      FROM events e
      LEFT JOIN event_statistics es ON e.id = es.event_id
      WHERE e.id = $1 AND e.is_published = TRUE
    `, [eventId]);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Get related data
    const [prizeStructure, invitedTeams, partners] = await Promise.all([
      queryAll<EventPrizeStructure>(
        'SELECT * FROM event_prize_structure WHERE event_id = $1 ORDER BY sort_order',
        [eventId]
      ),
      queryAll<EventInvitedTeam>(
        'SELECT * FROM event_invited_teams WHERE event_id = $1 ORDER BY sort_order',
        [eventId]
      ),
      queryAll<EventPartner>(
        'SELECT * FROM event_partners WHERE event_id = $1 ORDER BY sort_order',
        [eventId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        ...event,
        prize_structure: prizeStructure,
        invited_teams: invitedTeams,
        partners,
      },
    });
  } catch (error) {
    logger.error('Get public event error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event',
    });
  }
});

/**
 * GET /api/public/events/:eventId/teams
 * Get teams for a published event
 */
router.get('/events/:eventId/teams', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Check if event is published
    const event = await queryOne<Event>(
      'SELECT id FROM events WHERE id = $1 AND is_published = TRUE',
      [eventId]
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    const teams = await queryAll<TeamResponse>(`
      SELECT t.id, t.event_id, t.name, t.owner_name, t.owner_avatar_url, 
             t.purse, t.coins_left, t.is_active,
             COALESCE(COUNT(p.id), 0)::integer as player_count
      FROM teams t
      LEFT JOIN players p ON t.id = p.team_id AND p.status = 'sold'
      WHERE t.event_id = $1 AND t.is_active = TRUE
      GROUP BY t.id
      ORDER BY t.name ASC
    `, [eventId]);

    res.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    logger.error('Get public event teams error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get teams',
    });
  }
});

/**
 * GET /api/public/events/:eventId/players
 * Get players for a published event
 */
router.get('/events/:eventId/players', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status, role } = req.query;

    // Check if event is published
    const event = await queryOne<Event>(
      'SELECT id FROM events WHERE id = $1 AND is_published = TRUE',
      [eventId]
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    const conditions: string[] = ['p.event_id = $1'];
    const params: unknown[] = [eventId];

    if (status) {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }

    if (role) {
      params.push(role);
      conditions.push(`p.role = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const players = await queryAll<PlayerResponse>(`
      SELECT p.*, t.name as team_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      ${whereClause}
      ORDER BY p.rank_point DESC, p.name ASC
    `, params);

    res.json({
      success: true,
      data: { players },
    });
  } catch (error) {
    logger.error('Get public event players error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get players',
    });
  }
});

/**
 * GET /api/public/events/:eventId/auction
 * Get auction state for a published event
 */
router.get('/events/:eventId/auction', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Check if event is published
    const event = await queryOne<Event>(
      'SELECT id FROM events WHERE id = $1 AND is_published = TRUE',
      [eventId]
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    const state = await queryOne<{
      is_active: boolean;
      current_player_id: string | null;
      current_bid: number | null;
      current_bidder_id: string | null;
      start_time: Date | null;
      duration: number;
      bid_increments: number[];
    }>(
      'SELECT is_active, current_player_id, current_bid, current_bidder_id, start_time, duration, bid_increments FROM auction_state WHERE event_id = $1',
      [eventId]
    );

    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'Auction state not found',
      });
    }

    // Get player and bidder details if auction is active
    let currentPlayer: PlayerResponse | null = null;
    let currentBidder: TeamResponse | null = null;

    if (state.current_player_id) {
      currentPlayer = await queryOne<PlayerResponse>(
        'SELECT * FROM players WHERE id = $1',
        [state.current_player_id]
      );
    }

    if (state.current_bidder_id) {
      currentBidder = await queryOne<TeamResponse>(
        'SELECT id, event_id, name, owner_name, owner_avatar_url, purse, coins_left FROM teams WHERE id = $1',
        [state.current_bidder_id]
      );
    }

    // Calculate time remaining
    let timeRemaining: number | undefined;
    if (state.is_active && state.start_time) {
      const elapsed = (Date.now() - new Date(state.start_time).getTime()) / 1000;
      timeRemaining = Math.max(0, state.duration - elapsed);
    }

    res.json({
      success: true,
      data: {
        is_active: state.is_active,
        current_player: currentPlayer,
        current_bid: state.current_bid,
        current_bidder: currentBidder,
        start_time: state.start_time?.toISOString() || null,
        duration: state.duration,
        bid_increments: state.bid_increments || [100, 500, 1000],
        time_remaining: timeRemaining,
      },
    });
  } catch (error) {
    logger.error('Get public auction state error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auction state',
    });
  }
});

export default router;
