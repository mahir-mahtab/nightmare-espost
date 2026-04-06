// ============================================================================
// Content Creators Routes
// ============================================================================

import { Router, Request, Response } from 'express';
import { queryOne, queryAll, queryCount } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../services/logger.js';
import type { ContentCreator, CreateContentCreatorRequest } from '../types/index.js';

const router = Router();

/**
 * GET /api/creators
 * List all content creators
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role, is_featured, is_active = 'true', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }

    if (is_featured !== undefined) {
      params.push(is_featured === 'true');
      conditions.push(`is_featured = $${params.length}`);
    }

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      conditions.push(`is_active = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const creators = await queryAll<ContentCreator>(`
      SELECT * FROM content_creators
      ${whereClause}
      ORDER BY sort_order ASC, name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const total = await queryCount(`SELECT COUNT(*) FROM content_creators ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        creators,
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Get creators error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content creators',
    });
  }
});

/**
 * GET /api/creators/:id
 * Get single content creator
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const creator = await queryOne<ContentCreator>(
      'SELECT * FROM content_creators WHERE id = $1',
      [id]
    );

    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Content creator not found',
      });
    }

    res.json({
      success: true,
      data: creator,
    });
  } catch (error) {
    logger.error('Get creator error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content creator',
    });
  }
});

/**
 * POST /api/creators
 * Create content creator (admin only)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const data: CreateContentCreatorRequest = req.body;

    if (!data.name || !data.role) {
      return res.status(400).json({
        success: false,
        error: 'name and role are required',
      });
    }

    const creator = await queryOne<ContentCreator>(`
      INSERT INTO content_creators (
        name, role, image_url, bio,
        youtube_url, twitch_url, facebook_url, instagram_url, twitter_url,
        is_featured, is_active, sort_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `, [
      data.name,
      data.role,
      data.image_url || null,
      data.bio || null,
      data.youtube_url || null,
      data.twitch_url || null,
      data.facebook_url || null,
      data.instagram_url || null,
      data.twitter_url || null,
      data.is_featured || false,
      data.is_active !== false,
      data.sort_order || 0,
    ]);

    logger.info('Content creator created', { creatorId: creator!.id });

    res.status(201).json({
      success: true,
      data: creator,
    });
  } catch (error) {
    logger.error('Create creator error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create content creator',
    });
  }
});

/**
 * PUT /api/creators/:id
 * Update content creator (admin only)
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<CreateContentCreatorRequest> = req.body;

    // Check if exists
    const existing = await queryOne<ContentCreator>('SELECT id FROM content_creators WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Content creator not found',
      });
    }

    // Build dynamic update
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fields = [
      'name', 'role', 'image_url', 'bio',
      'youtube_url', 'twitch_url', 'facebook_url', 'instagram_url', 'twitter_url',
      'is_featured', 'is_active', 'sort_order'
    ];

    for (const field of fields) {
      if (data[field as keyof CreateContentCreatorRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(data[field as keyof CreateContentCreatorRequest]);
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

    const creator = await queryOne<ContentCreator>(`
      UPDATE content_creators SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *
    `, params);

    logger.info('Content creator updated', { creatorId: id });

    res.json({
      success: true,
      data: creator,
    });
  } catch (error) {
    logger.error('Update creator error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content creator',
    });
  }
});

/**
 * DELETE /api/creators/:id
 * Delete content creator (admin only)
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await queryOne<ContentCreator>(
      'DELETE FROM content_creators WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Content creator not found',
      });
    }

    logger.info('Content creator deleted', { creatorId: id });

    res.json({
      success: true,
      message: 'Content creator deleted successfully',
    });
  } catch (error) {
    logger.error('Delete creator error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content creator',
    });
  }
});

export default router;
