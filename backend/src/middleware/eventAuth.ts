import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { authService, EventSessionPayload } from '../services/authService.js';
import { eventService } from '../services/eventService.js';

export const requireEventAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Event authentication required', 401));
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyEventSessionToken(token);

    if (!payload) {
      return next(new AppError('Invalid or expired session token', 401));
    }

    // Verify eventId matches route param (resolve slug to ID if needed)
    const eventIdOrSlug = req.params.eventId;
    if (eventIdOrSlug) {
      const event = await eventService.getEvent(eventIdOrSlug);
      if (event.id !== payload.eventId) {
        return next(new AppError('Session does not match event', 403));
      }
    }

    // Attach session to request
    (req as any).session = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireOwnerRole = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const session = (req as any).session as EventSessionPayload | undefined;

  if (!session || session.role !== 'owner') {
    return next(new AppError('Owner role required for this action', 403));
  }

  if (!session.ownerId) {
    return next(new AppError('Owner ID required', 403));
  }

  next();
};
