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
    return next(new AppError('Admin authentication required', 401));
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyAdminToken(token);

  if (!payload) {
    return next(new AppError('Invalid or expired admin token', 401));
  }

  // Attach admin info to request
  (req as any).admin = payload;
  next();
};
