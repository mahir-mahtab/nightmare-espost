// ============================================================================
// Organization Settings & Rosters Routes
// ============================================================================

import { Router, Request, Response } from 'express';
import { queryOne, queryAll } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../services/logger.js';
import type { OrgSettings, OrgRoster, CreateOrgRosterRequest } from '../types/index.js';

const router = Router();

// ============================================================================
// Organization Settings
// ============================================================================

/**
 * GET /api/settings
 * Get organization settings
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await queryOne<OrgSettings>(
      'SELECT * FROM org_settings LIMIT 1'
    );

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        success: true,
        data: {
          name: 'Nightmare Esports',
          location: 'Bangladesh',
          focus: 'PUBG Mobile',
          services: ['Tournament Operations', 'Team Management', 'Talent Development'],
          expansion: 'Multiple game titles planned',
          partnerships: 'Open for sponsorships and strategic partnerships',
          social: {
            facebook: null,
            youtube: null,
            discord: null,
            website: null,
            twitter: null,
            instagram: null,
          },
        },
      });
    }

    res.json({
      success: true,
      data: {
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
          twitter: settings.twitter_url,
          instagram: settings.instagram_url,
        },
      },
    });
  } catch (error) {
    logger.error('Get settings error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings',
    });
  }
});

/**
 * PUT /api/settings
 * Update organization settings (admin only)
 */
router.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Check if settings exist
    const existing = await queryOne<OrgSettings>('SELECT id FROM org_settings LIMIT 1');

    let settings: OrgSettings | null;

    if (existing) {
      // Update existing settings
      const updates: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      const fields = [
        'name', 'location', 'focus', 'services', 'expansion', 'partnerships',
        'facebook_url', 'youtube_url', 'discord_url', 'website_url', 'twitter_url', 'instagram_url'
      ];

      for (const field of fields) {
        if (data[field] !== undefined) {
          updates.push(`${field} = $${paramIndex}`);
          params.push(field === 'services' ? JSON.stringify(data[field]) : data[field]);
          paramIndex++;
        }
      }

      // Handle nested social object
      if (data.social) {
        const socialFields = ['facebook', 'youtube', 'discord', 'website', 'twitter', 'instagram'];
        for (const sf of socialFields) {
          if (data.social[sf] !== undefined) {
            updates.push(`${sf}_url = $${paramIndex}`);
            params.push(data.social[sf]);
            paramIndex++;
          }
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
      }

      params.push(existing.id);

      settings = await queryOne<OrgSettings>(`
        UPDATE org_settings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *
      `, params);
    } else {
      // Create new settings
      settings = await queryOne<OrgSettings>(`
        INSERT INTO org_settings (
          name, location, focus, services, expansion, partnerships,
          facebook_url, youtube_url, discord_url, website_url, twitter_url, instagram_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING *
      `, [
        data.name || 'Nightmare Esports',
        data.location || 'Bangladesh',
        data.focus || 'PUBG Mobile',
        JSON.stringify(data.services || []),
        data.expansion || null,
        data.partnerships || null,
        data.social?.facebook || data.facebook_url || null,
        data.social?.youtube || data.youtube_url || null,
        data.social?.discord || data.discord_url || null,
        data.social?.website || data.website_url || null,
        data.social?.twitter || data.twitter_url || null,
        data.social?.instagram || data.instagram_url || null,
      ]);
    }

    logger.info('Settings updated');

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Update settings error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
    });
  }
});

// ============================================================================
// Organization Rosters
// ============================================================================

/**
 * GET /api/rosters
 * List organization rosters
 */
router.get('/rosters', async (req: Request, res: Response) => {
  try {
    const { status, game } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (game) {
      params.push(game);
      conditions.push(`game = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rosters = await queryAll<OrgRoster>(`
      SELECT * FROM org_rosters
      ${whereClause}
      ORDER BY sort_order ASC, name ASC
    `, params);

    res.json({
      success: true,
      data: { rosters },
    });
  } catch (error) {
    logger.error('Get rosters error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rosters',
    });
  }
});

/**
 * GET /api/rosters/:id
 * Get single roster
 */
router.get('/rosters/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const roster = await queryOne<OrgRoster>(
      'SELECT * FROM org_rosters WHERE id = $1',
      [id]
    );

    if (!roster) {
      return res.status(404).json({
        success: false,
        error: 'Roster not found',
      });
    }

    res.json({
      success: true,
      data: roster,
    });
  } catch (error) {
    logger.error('Get roster error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get roster',
    });
  }
});

/**
 * POST /api/rosters
 * Create roster (admin only)
 */
router.post('/rosters', requireAuth, async (req: Request, res: Response) => {
  try {
    const data: CreateOrgRosterRequest = req.body;

    if (!data.name || !data.game) {
      return res.status(400).json({
        success: false,
        error: 'name and game are required',
      });
    }

    const roster = await queryOne<OrgRoster>(`
      INSERT INTO org_rosters (name, role, status, game, logo_url, description, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      data.name,
      data.role || null,
      data.status || 'active',
      data.game,
      data.logo_url || null,
      data.description || null,
      data.sort_order || 0,
    ]);

    logger.info('Roster created', { rosterId: roster!.id });

    res.status(201).json({
      success: true,
      data: roster,
    });
  } catch (error) {
    logger.error('Create roster error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create roster',
    });
  }
});

/**
 * PUT /api/rosters/:id
 * Update roster (admin only)
 */
router.put('/rosters/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<CreateOrgRosterRequest> = req.body;

    // Check if exists
    const existing = await queryOne<OrgRoster>('SELECT id FROM org_rosters WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Roster not found',
      });
    }

    // Build dynamic update
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fields = ['name', 'role', 'status', 'game', 'logo_url', 'description', 'sort_order'];

    for (const field of fields) {
      if (data[field as keyof CreateOrgRosterRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(data[field as keyof CreateOrgRosterRequest]);
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

    const roster = await queryOne<OrgRoster>(`
      UPDATE org_rosters SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *
    `, params);

    logger.info('Roster updated', { rosterId: id });

    res.json({
      success: true,
      data: roster,
    });
  } catch (error) {
    logger.error('Update roster error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update roster',
    });
  }
});

/**
 * DELETE /api/rosters/:id
 * Delete roster (admin only)
 */
router.delete('/rosters/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await queryOne<OrgRoster>(
      'DELETE FROM org_rosters WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Roster not found',
      });
    }

    logger.info('Roster deleted', { rosterId: id });

    res.json({
      success: true,
      message: 'Roster deleted successfully',
    });
  } catch (error) {
    logger.error('Delete roster error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete roster',
    });
  }
});

export default router;
