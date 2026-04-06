// ============================================================================
// Authentication Middleware
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken } from '../utils/auth.js';
import { logger } from '../services/logger.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to require authentication
 * Validates JWT token and adds user to request
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  req.user = decoded;
  logger.debug('User authenticated', { userId: decoded.id, username: decoded.username });
  next();
};

/**
 * Middleware to require admin role
 * Must be used after requireAuth
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
};

/**
 * Middleware to require super admin role
 * Must be used after requireAuth
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required',
    });
  }

  next();
};

/**
 * Optional authentication middleware
 * Adds user to request if valid token exists, but doesn't require it
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req.headers.authorization);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};
