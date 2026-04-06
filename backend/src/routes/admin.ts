// ============================================================================
// Admin Authentication Routes
// ============================================================================

import { Router, Request, Response } from 'express';
import { queryOne, queryAll } from '../utils/db.js';
import { comparePassword, generateToken } from '../utils/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../services/logger.js';
import type { AdminUser, AdminUserResponse, DashboardStats } from '../types/index.js';

const router = Router();

/**
 * POST /api/admin/login
 * Admin login endpoint
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Find user by username
    const user = await queryOne<AdminUser>(
      'SELECT * FROM admin_users WHERE username = $1 AND is_active = TRUE',
      [username]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Update last login
    await queryOne(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const userResponse: AdminUserResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(userResponse);

    logger.info('Admin login successful', { username: user.username });

    res.json({
      success: true,
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error) {
    logger.error('Admin login error', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * GET /api/admin/me
 * Get current admin user info
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await queryOne<AdminUser>(
      'SELECT id, username, name, email, role, last_login, created_at FROM admin_users WHERE id = $1',
      [req.user!.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Get admin user error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
    });
  }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', requireAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await queryOne<DashboardStats>(
      'SELECT * FROM dashboard_stats'
    );

    res.json({
      success: true,
      data: stats || {
        total_events: 0,
        active_events: 0,
        total_players: 0,
        total_teams: 0,
        total_creators: 0,
        total_achievements: 0,
      },
    });
  } catch (error) {
    logger.error('Get dashboard stats error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

/**
 * GET /api/admin/users
 * List all admin users (super_admin only)
 */
router.get('/users', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const users = await queryAll<AdminUser>(
      'SELECT id, username, name, email, role, is_active, last_login, created_at FROM admin_users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error('Get admin users error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
    });
  }
});

export default router;
