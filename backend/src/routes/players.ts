// ============================================================================
// Players Routes
// ============================================================================

import { Router, Request, Response } from 'express';
import { queryOne, queryAll, queryCount } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../services/logger.js';
import type { Player, PlayerResponse, CreatePlayerRequest } from '../types/index.js';

const router = Router({ mergeParams: true });

/**
 * GET /api/events/:eventId/players
 * List players for an event
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { search, role, status, team_id, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build WHERE clause
    const conditions: string[] = ['p.event_id = $1'];
    const params: unknown[] = [eventId];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`p.name ILIKE $${params.length}`);
    }

    if (role) {
      params.push(role);
      conditions.push(`p.role = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }

    if (team_id) {
      params.push(team_id);
      conditions.push(`p.team_id = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const players = await queryAll<PlayerResponse>(`
      SELECT p.*, t.name as team_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      ${whereClause}
      ORDER BY p.rank_point DESC, p.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const total = await queryCount(`SELECT COUNT(*) FROM players p ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        players,
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get players error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get players',
    });
  }
});

/**
 * GET /api/events/:eventId/players/:playerId
 * Get single player
 */
router.get('/:playerId', async (req: Request, res: Response) => {
  try {
    const { eventId, playerId } = req.params;

    const player = await queryOne<PlayerResponse>(`
      SELECT p.*, t.name as team_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.id = $1 AND p.event_id = $2
    `, [playerId, eventId]);

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }

    res.json({
      success: true,
      data: player,
    });
  } catch (error) {
    logger.error('Get player error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get player',
    });
  }
});

/**
 * POST /api/events/:eventId/players
 * Add player to event (admin only)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const data: CreatePlayerRequest = req.body;

    if (!data.name) {
      return res.status(400).json({
        success: false,
        error: 'Player name is required',
      });
    }

    // Check if event exists
    const event = await queryOne('SELECT id FROM events WHERE id = $1', [eventId]);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    const player = await queryOne<Player>(`
      INSERT INTO players (
        event_id, name, role, original_team_name, base_price,
        rank_point, nm_coin, stats, image_url, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *
    `, [
      eventId,
      data.name,
      data.role || null,
      data.original_team_name || null,
      data.base_price || 500,
      data.rank_point || 0,
      data.nm_coin || 0,
      JSON.stringify(data.stats || {}),
      data.image_url || null,
      data.status || 'available',
    ]);

    logger.info('Player added', { playerId: player!.id, eventId });

    res.status(201).json({
      success: true,
      data: player,
    });
  } catch (error) {
    logger.error('Add player error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add player',
    });
  }
});

/**
 * PUT /api/events/:eventId/players/:playerId
 * Update player (admin only)
 */
router.put('/:playerId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId, playerId } = req.params;
    const data: Partial<CreatePlayerRequest> = req.body;

    // Check if player exists
    const existing = await queryOne<Player>(
      'SELECT id FROM players WHERE id = $1 AND event_id = $2',
      [playerId, eventId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }

    // Build dynamic update
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fields = ['name', 'role', 'original_team_name', 'base_price', 'rank_point', 'nm_coin', 'image_url', 'status'];

    for (const field of fields) {
      if (data[field as keyof CreatePlayerRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(data[field as keyof CreatePlayerRequest]);
        paramIndex++;
      }
    }

    if (data.stats !== undefined) {
      updates.push(`stats = $${paramIndex}`);
      params.push(JSON.stringify(data.stats));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    params.push(playerId);

    const player = await queryOne<Player>(`
      UPDATE players SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *
    `, params);

    logger.info('Player updated', { playerId });

    res.json({
      success: true,
      data: player,
    });
  } catch (error) {
    logger.error('Update player error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update player',
    });
  }
});

/**
 * DELETE /api/events/:eventId/players/:playerId
 * Delete player (admin only)
 */
router.delete('/:playerId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId, playerId } = req.params;

    const result = await queryOne<Player>(
      'DELETE FROM players WHERE id = $1 AND event_id = $2 RETURNING id',
      [playerId, eventId]
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }

    logger.info('Player deleted', { playerId, eventId });

    res.json({
      success: true,
      message: 'Player deleted successfully',
    });
  } catch (error) {
    logger.error('Delete player error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete player',
    });
  }
});

/**
 * POST /api/events/:eventId/players/:playerId/assign
 * Assign player to team (admin only)
 */
router.post('/:playerId/assign', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId, playerId } = req.params;
    const { team_id, sold_price } = req.body;

    if (!team_id || sold_price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'team_id and sold_price are required',
      });
    }

    const player = await queryOne<Player>(`
      UPDATE players 
      SET team_id = $1, sold_price = $2, status = 'sold'
      WHERE id = $3 AND event_id = $4
      RETURNING *
    `, [team_id, sold_price, playerId, eventId]);

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }

    logger.info('Player assigned to team', { playerId, teamId: team_id, soldPrice: sold_price });

    res.json({
      success: true,
      data: player,
    });
  } catch (error) {
    logger.error('Assign player error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign player',
    });
  }
});

/**
 * POST /api/events/:eventId/players/:playerId/unassign
 * Unassign player from team (admin only)
 */
router.post('/:playerId/unassign', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId, playerId } = req.params;

    const player = await queryOne<Player>(`
      UPDATE players 
      SET team_id = NULL, sold_price = NULL, status = 'available'
      WHERE id = $1 AND event_id = $2
      RETURNING *
    `, [playerId, eventId]);

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }

    logger.info('Player unassigned from team', { playerId });

    res.json({
      success: true,
      data: player,
    });
  } catch (error) {
    logger.error('Unassign player error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unassign player',
    });
  }
});

export default router;
