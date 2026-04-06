// ============================================================================
// Achievements Routes
// ============================================================================

import { Router, Request, Response } from 'express';
import { queryOne, queryAll, queryCount } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../services/logger.js';
import type { Achievement, CreateAchievementRequest } from '../types/index.js';

const router = Router();

/**
 * GET /api/achievements
 * List all achievements
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { event, team, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (event) {
      params.push(`%${event}%`);
      conditions.push(`event ILIKE $${params.length}`);
    }

    if (team) {
      params.push(`%${team}%`);
      conditions.push(`team ILIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const achievements = await queryAll<Achievement>(`
      SELECT * FROM achievements
      ${whereClause}
      ORDER BY sort_order ASC, event_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const total = await queryCount(`SELECT COUNT(*) FROM achievements ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        achievements,
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get achievements error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievements',
    });
  }
});

/**
 * GET /api/achievements/:id
 * Get single achievement
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const achievement = await queryOne<Achievement>(
      'SELECT * FROM achievements WHERE id = $1',
      [id]
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        error: 'Achievement not found',
      });
    }

    res.json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    logger.error('Get achievement error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievement',
    });
  }
});

/**
 * POST /api/achievements
 * Create achievement (admin only)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const data: CreateAchievementRequest = req.body;

    if (!data.rank || !data.placement || !data.team || !data.event || !data.event_date) {
      return res.status(400).json({
        success: false,
        error: 'rank, placement, team, event, and event_date are required',
      });
    }

    const achievement = await queryOne<Achievement>(`
      INSERT INTO achievements (
        rank, placement, team, tag, event, event_date, color, image_url, description, sort_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *
    `, [
      data.rank,
      data.placement,
      data.team,
      data.tag || null,
      data.event,
      data.event_date,
      data.color || 'primary',
      data.image_url || null,
      data.description || null,
      data.sort_order || 0,
    ]);

    logger.info('Achievement created', { achievementId: achievement!.id });

    res.status(201).json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    logger.error('Create achievement error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create achievement',
    });
  }
});

/**
 * PUT /api/achievements/:id
 * Update achievement (admin only)
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<CreateAchievementRequest> = req.body;

    // Check if exists
    const existing = await queryOne<Achievement>('SELECT id FROM achievements WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Achievement not found',
      });
    }

    // Build dynamic update
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fields = ['rank', 'placement', 'team', 'tag', 'event', 'event_date', 'color', 'image_url', 'description', 'sort_order'];

    for (const field of fields) {
      if (data[field as keyof CreateAchievementRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(data[field as keyof CreateAchievementRequest]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    params.push(id);

    const achievement = await queryOne<Achievement>(`
      UPDATE achievements SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *
    `, params);

    logger.info('Achievement updated', { achievementId: id });

    res.json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    logger.error('Update achievement error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update achievement',
    });
  }
});

/**
 * DELETE /api/achievements/:id
 * Delete achievement (admin only)
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await queryOne<Achievement>(
      'DELETE FROM achievements WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Achievement not found',
      });
    }

    logger.info('Achievement deleted', { achievementId: id });

    res.json({
      success: true,
      message: 'Achievement deleted successfully',
    });
  } catch (error) {
    logger.error('Delete achievement error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete achievement',
    });
  }
});

export default router;
