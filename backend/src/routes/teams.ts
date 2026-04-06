// ============================================================================
// Teams Routes
// ============================================================================

import { Router, Request, Response } from 'express';
import { queryOne, queryAll } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { hashPassword } from '../utils/auth.js';
import { logger } from '../services/logger.js';
import type { Team, TeamResponse, CreateTeamRequest, PlayerResponse } from '../types/index.js';

const router = Router({ mergeParams: true });

/**
 * GET /api/events/:eventId/teams
 * List teams for an event
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const teams = await queryAll<TeamResponse>(`
      SELECT t.id, t.event_id, t.name, t.owner_name, t.owner_email, 
             t.owner_avatar_url, t.purse, t.coins_left, t.is_active,
             COALESCE(COUNT(p.id), 0)::integer as player_count
      FROM teams t
      LEFT JOIN players p ON t.id = p.team_id AND p.status = 'sold'
      WHERE t.event_id = $1
      GROUP BY t.id
      ORDER BY t.name ASC
    `, [eventId]);

    res.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    logger.error('Get teams error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get teams',
    });
  }
});

/**
 * GET /api/events/:eventId/teams/:teamId
 * Get single team with roster
 */
router.get('/:teamId', async (req: Request, res: Response) => {
  try {
    const { eventId, teamId } = req.params;

    const team = await queryOne<TeamResponse>(`
      SELECT t.id, t.event_id, t.name, t.owner_name, t.owner_email,
             t.owner_avatar_url, t.purse, t.coins_left, t.is_active
      FROM teams t
      WHERE t.id = $1 AND t.event_id = $2
    `, [teamId, eventId]);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // Get team roster
    const players = await queryAll<PlayerResponse>(`
      SELECT * FROM players 
      WHERE team_id = $1 AND status = 'sold'
      ORDER BY sold_price DESC
    `, [teamId]);

    res.json({
      success: true,
      data: {
        ...team,
        players,
        player_count: players.length,
      },
    });
  } catch (error) {
    logger.error('Get team error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get team',
    });
  }
});

/**
 * POST /api/events/:eventId/teams
 * Create team (admin only)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const data: CreateTeamRequest = req.body;

    if (!data.name || !data.owner_name) {
      return res.status(400).json({
        success: false,
        error: 'Team name and owner name are required',
      });
    }

    // Get event to check purse amount
    const event = await queryOne<{ purse_per_team: number }>(
      'SELECT purse_per_team FROM events WHERE id = $1',
      [eventId]
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    const purse = data.purse || event.purse_per_team;
    let passwordHash = null;

    if (data.owner_password) {
      passwordHash = await hashPassword(data.owner_password);
    }

    const team = await queryOne<Team>(`
      INSERT INTO teams (
        event_id, name, owner_name, owner_email, owner_phone,
        owner_avatar_url, owner_password_hash, purse, coins_left
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $8
      ) RETURNING *
    `, [
      eventId,
      data.name,
      data.owner_name,
      data.owner_email || null,
      data.owner_phone || null,
      data.owner_avatar_url || null,
      passwordHash,
      purse,
    ]);

    logger.info('Team created', { teamId: team!.id, eventId });

    // Remove password hash from response
    const { owner_password_hash, ...teamResponse } = team!;

    res.status(201).json({
      success: true,
      data: teamResponse,
    });
  } catch (error) {
    logger.error('Create team error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create team',
    });
  }
});

/**
 * PUT /api/events/:eventId/teams/:teamId
 * Update team (admin only)
 */
router.put('/:teamId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId, teamId } = req.params;
    const data: Partial<CreateTeamRequest> = req.body;

    // Check if team exists
    const existing = await queryOne<Team>(
      'SELECT id FROM teams WHERE id = $1 AND event_id = $2',
      [teamId, eventId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // Build dynamic update
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fields = ['name', 'owner_name', 'owner_email', 'owner_phone', 'owner_avatar_url', 'purse', 'coins_left'];

    for (const field of fields) {
      const value = data[field as keyof CreateTeamRequest];
      if (value !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (data.owner_password) {
      updates.push(`owner_password_hash = $${paramIndex}`);
      params.push(await hashPassword(data.owner_password));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    params.push(teamId);

    const team = await queryOne<Team>(`
      UPDATE teams SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *
    `, params);

    logger.info('Team updated', { teamId });

    // Remove password hash from response
    const { owner_password_hash, ...teamResponse } = team!;

    res.json({
      success: true,
      data: teamResponse,
    });
  } catch (error) {
    logger.error('Update team error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update team',
    });
  }
});

/**
 * DELETE /api/events/:eventId/teams/:teamId
 * Delete team (admin only)
 */
router.delete('/:teamId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId, teamId } = req.params;

    const result = await queryOne<Team>(
      'DELETE FROM teams WHERE id = $1 AND event_id = $2 RETURNING id',
      [teamId, eventId]
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    logger.info('Team deleted', { teamId, eventId });

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    logger.error('Delete team error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete team',
    });
  }
});

/**
 * GET /api/events/:eventId/teams/:teamId/roster
 * Get team roster (players)
 */
router.get('/:teamId/roster', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    const roster = await queryAll<PlayerResponse>(`
      SELECT * FROM players 
      WHERE team_id = $1 AND status = 'sold'
      ORDER BY sold_price DESC
    `, [teamId]);

    res.json({
      success: true,
      data: { roster },
    });
  } catch (error) {
    logger.error('Get team roster error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get team roster',
    });
  }
});

export default router;
