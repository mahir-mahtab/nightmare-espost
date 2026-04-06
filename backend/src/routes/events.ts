// ============================================================================
// Events Routes
// ============================================================================

import { Router, Request, Response } from 'express';
import { queryOne, queryAll, queryCount } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../services/logger.js';
import type { Event, EventWithStats, CreateEventRequest, EventPrizeStructure, EventInvitedTeam, EventPartner } from '../types/index.js';

const router = Router();

/**
 * GET /api/events
 * List all events (with optional filters)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, is_published, game, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (is_published !== undefined) {
      params.push(is_published === 'true');
      conditions.push(`is_published = $${params.length}`);
    }

    if (game) {
      params.push(game);
      conditions.push(`game = $${params.length}`);
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const events = await queryAll<EventWithStats>(`
      SELECT e.*, es.team_count, es.player_count, es.sold_player_count, 
             es.available_player_count, es.total_sold_value, es.avg_sold_price
      FROM events e
      LEFT JOIN event_statistics es ON e.id = es.event_id
      ${whereClause}
      ORDER BY e.start_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const totalResult = await queryCount(`SELECT COUNT(*) FROM events ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        events,
        total: totalResult,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(totalResult / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get events error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get events',
    });
  }
});

/**
 * GET /api/events/:eventId
 * Get single event with all related data
 */
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await queryOne<EventWithStats>(`
      SELECT e.*, es.team_count, es.player_count, es.sold_player_count,
             es.available_player_count, es.total_sold_value, es.avg_sold_price
      FROM events e
      LEFT JOIN event_statistics es ON e.id = es.event_id
      WHERE e.id = $1
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
    logger.error('Get event error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event',
    });
  }
});

/**
 * POST /api/events
 * Create new event (admin only)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const data: CreateEventRequest = req.body;

    if (!data.name || !data.start_date || !data.end_date) {
      return res.status(400).json({
        success: false,
        error: 'Name, start_date, and end_date are required',
      });
    }

    const event = await queryOne<Event>(`
      INSERT INTO events (
        name, description, season, game, mode,
        start_date, end_date, registration_deadline,
        location, stream_start_time, stream_url, banner_url,
        max_teams, max_players_per_team, registration_slots,
        purse_per_team, auction_duration, is_published, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `, [
      data.name,
      data.description || null,
      data.season || null,
      data.game || 'PUBG Mobile',
      data.mode || null,
      data.start_date,
      data.end_date,
      data.registration_deadline || null,
      data.location || null,
      data.stream_start_time || null,
      data.stream_url || null,
      data.banner_url || null,
      data.max_teams || 8,
      data.max_players_per_team || 4,
      data.registration_slots || 50,
      data.purse_per_team || 5000,
      data.auction_duration || 30,
      data.is_published || false,
      data.status || 'draft',
    ]);

    // Create auction state for the event
    await queryOne(
      'INSERT INTO auction_state (event_id, duration) VALUES ($1, $2)',
      [event!.id, data.auction_duration || 30]
    );

    logger.info('Event created', { eventId: event!.id, name: data.name });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Create event error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event',
    });
  }
});

/**
 * PUT /api/events/:eventId
 * Update event (admin only)
 */
router.put('/:eventId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const data: Partial<CreateEventRequest> = req.body;

    // Check if event exists
    const existing = await queryOne<Event>('SELECT id FROM events WHERE id = $1', [eventId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fields = [
      'name', 'description', 'season', 'game', 'mode',
      'start_date', 'end_date', 'registration_deadline',
      'location', 'stream_start_time', 'stream_url', 'banner_url',
      'max_teams', 'max_players_per_team', 'registration_slots',
      'purse_per_team', 'auction_duration', 'is_published', 'status',
    ];

    for (const field of fields) {
      if (data[field as keyof CreateEventRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(data[field as keyof CreateEventRequest]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    params.push(eventId);

    const event = await queryOne<Event>(`
      UPDATE events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *
    `, params);

    logger.info('Event updated', { eventId });

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Update event error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event',
    });
  }
});

/**
 * DELETE /api/events/:eventId
 * Delete event (admin only)
 */
router.delete('/:eventId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const result = await queryOne<Event>('DELETE FROM events WHERE id = $1 RETURNING id', [eventId]);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    logger.info('Event deleted', { eventId });

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    logger.error('Delete event error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
    });
  }
});

/**
 * POST /api/events/:eventId/publish
 * Publish event (admin only)
 */
router.post('/:eventId/publish', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await queryOne<Event>(`
      UPDATE events SET is_published = TRUE, status = 'published' WHERE id = $1 RETURNING *
    `, [eventId]);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    logger.info('Event published', { eventId });

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Publish event error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish event',
    });
  }
});

/**
 * POST /api/events/:eventId/unpublish
 * Unpublish event (admin only)
 */
router.post('/:eventId/unpublish', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await queryOne<Event>(`
      UPDATE events SET is_published = FALSE, status = 'draft' WHERE id = $1 RETURNING *
    `, [eventId]);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    logger.info('Event unpublished', { eventId });

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Unpublish event error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unpublish event',
    });
  }
});

/**
 * GET /api/events/:eventId/stats
 * Get event statistics
 */
router.get('/:eventId/stats', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const stats = await queryOne<EventWithStats>(`
      SELECT * FROM event_statistics WHERE event_id = $1
    `, [eventId]);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get event stats error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event statistics',
    });
  }
});

export default router;
