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
      return next(new AppError('Event authentication token is required.', 401, 'EVENT_AUTH_REQUIRED'));
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyEventSessionToken(token);

    if (!payload) {
      return next(new AppError('Event session is invalid or has expired. Please log in again.', 401, 'EVENT_TOKEN_INVALID'));
    }

    // Verify eventId matches route param (resolve slug to ID if needed)
    const eventIdOrSlug = req.params.eventId;
    if (eventIdOrSlug) {
      const event = await eventService.getEvent(eventIdOrSlug);
      if (event.id !== payload.eventId) {
        return next(new AppError('Session does not match the requested event.', 403, 'EVENT_SESSION_MISMATCH'));
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
    return next(new AppError('Only owner sessions can perform this action.', 403, 'OWNER_ROLE_REQUIRED'));
  }

  if (!session.ownerId) {
    return next(new AppError('Owner session is missing ownerId. Please re-login as owner.', 403, 'OWNER_ID_MISSING'));
  }

  next();
};
