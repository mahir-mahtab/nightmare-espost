import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { authService } from '../services/authService.js';

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Admin authentication token is required.', 401, 'ADMIN_AUTH_REQUIRED'));
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyAdminToken(token);

  if (!payload) {
    return next(new AppError('Admin session is invalid or has expired. Please sign in again.', 401, 'ADMIN_TOKEN_INVALID'));
  }

  // Attach admin info to request
  (req as any).admin = payload;
  next();
};
