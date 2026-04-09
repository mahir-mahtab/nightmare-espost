import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { eventService } from '../services/eventService.js';
import { AppError } from '../middleware/errorHandler.js';
import { eventLoginSchema } from '../utils/validators.js';

export const eventsController = {
  // List public events (no auth)
  async listPublicEvents(_req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventService.listPublicEvents();

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },

  async getLoginContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const event = await eventService.getEvent(eventId);
      const owners = await eventService.getOwners(event.id);

      res.json({
        success: true,
        data: {
          event: {
            id: event.id,
            slug: event.slug,
            title: event.title,
            season: event.season,
            game: event.game,
            mode: event.mode,
            streamStartTime: event.streamStartTime,
            bannerUrl: event.bannerUrl,
            status: event.status,
          },
          owners: owners.map((owner: any) => ({
            id: owner.id,
            name: owner.name,
            avatarUrl: owner.avatarUrl,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Event login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params; // This could be slug or ID
      const { password, displayName, role, ownerId } = eventLoginSchema.parse(req.body);

      // Validate owner role requires ownerId
      if (role === 'owner' && !ownerId) {
        throw new AppError('Owner role requires ownerId', 400);
      }

      // Verify event password and get event
      const isValid = await eventService.verifyEventPassword(eventId, password);
      if (!isValid) {
        throw new AppError('Invalid event password', 401);
      }

      // Get the actual event to use its ID
      const event = await eventService.getEvent(eventId);

      // If owner role, verify ownerId exists
      if (role === 'owner' && ownerId) {
        const owners = await eventService.getOwners(event.id);
        const ownerExists = owners.some((o: any) => o.id === ownerId);
        if (!ownerExists) {
          throw new AppError('Invalid owner ID', 400);
        }
      }

      const token = authService.generateEventSessionToken({
        eventId: event.id,
        displayName,
        role,
        ownerId: role === 'owner' ? ownerId : undefined,
      });

      res.json({
        success: true,
        data: {
          sessionToken: token,
          displayName,
          role,
          ownerId: role === 'owner' ? ownerId : undefined,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Validate session
  async validateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const session = (req as any).session;

      res.json({
        success: true,
        data: { session },
      });
    } catch (error) {
      next(error);
    }
  },

  // Logout (client-side token removal)
  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get event summary
  async getEventSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const summary = await eventService.getEventSummary(eventId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get teams
  async getTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const teams = await eventService.getTeams(eventId);

      res.json({
        success: true,
        data: teams,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get owners
  async getOwners(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const owners = await eventService.getOwners(eventId);

      res.json({
        success: true,
        data: owners,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get players
  async getPlayers(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const { search, role, status } = req.query;

      const players = await eventService.getPlayers(eventId, {
        search: search as string,
        role: role as string,
        status: status as any,
      });

      res.json({
        success: true,
        data: players,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get auction board
  async getAuctionBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const auctionBoard = await eventService.getAuctionBoard(eventId);

      res.json({
        success: true,
        data: auctionBoard,
      });
    } catch (error) {
      next(error);
    }
  },
};
