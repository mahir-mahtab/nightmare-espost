import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { authService } from '../services/authService.js';
import { eventService } from '../services/eventService.js';
import { auctionService } from '../services/auctionService.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  eventLoginSchema,
  ownerSignupSchema,
  playerSignupSchema,
  eventIdParamSchema,
  playersQuerySchema,
  auctionQuerySchema,
} from '../utils/validators.js';

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
      const { eventId } = eventIdParamSchema.parse(req.params);
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

  async getSignupContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = eventIdParamSchema.parse(req.params);
      const event = await eventService.getEvent(eventId);

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
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Event login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = eventIdParamSchema.parse(req.params);
      const { password, role, ownerId, ownerPassword } = eventLoginSchema.parse(req.body);

      const normalizedRole = role === 'guest' ? 'guest' : role;

      // Validate owner role requires ownerId
      if (normalizedRole === 'owner' && !ownerId) {
        throw new AppError('Please choose an owner profile before logging in as owner.', 400, 'OWNER_ID_REQUIRED');
      }

      if (normalizedRole === 'owner' && !ownerPassword) {
        throw new AppError('Owner password is required.', 400, 'OWNER_PASSWORD_REQUIRED');
      }

      // Verify event password and get event
      const isValid = await eventService.verifyEventPassword(eventId, password);
      if (!isValid) {
        throw new AppError('The event password is incorrect.', 401, 'EVENT_PASSWORD_INVALID');
      }

      // Get the actual event to use its ID
      const event = await eventService.getEvent(eventId);

      let resolvedDisplayName = 'Guest';
      let resolvedOwnerId: string | undefined;

      // If owner role, verify owner exists and password hash matches
      if (normalizedRole === 'owner' && ownerId) {
        const owner = await eventService.getOwnerById(event.id, ownerId);
        if (!owner) {
          throw new AppError('Selected owner does not belong to this event.', 400, 'OWNER_NOT_IN_EVENT');
        }

        if (!owner.passwordHash) {
          throw new AppError('Owner password is not configured. Please contact event admin.', 400, 'OWNER_PASSWORD_NOT_SET');
        }

        const matches = await bcrypt.compare(ownerPassword || '', owner.passwordHash);
        if (!matches) {
          throw new AppError('Owner password is incorrect.', 401, 'OWNER_PASSWORD_INVALID');
        }

        resolvedDisplayName = owner.name;
        resolvedOwnerId = owner.id;
      }

      const token = authService.generateEventSessionToken({
        eventId: event.id,
        displayName: resolvedDisplayName,
        role: normalizedRole,
        ownerId: normalizedRole === 'owner' ? resolvedOwnerId : undefined,
      });

      res.json({
        success: true,
        data: {
          eventId: event.id,
          eventSlug: event.slug,
          sessionToken: token,
          displayName: resolvedDisplayName,
          role: normalizedRole,
          ownerId: normalizedRole === 'owner' ? resolvedOwnerId : undefined,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async signupOwner(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = eventIdParamSchema.parse(req.params);
      const payload = ownerSignupSchema.parse(req.body);

      const isValid = await eventService.verifyEventPassword(eventId, payload.eventPassword);
      if (!isValid) {
        throw new AppError('The event password is incorrect.', 401, 'EVENT_PASSWORD_INVALID');
      }

      const event = await eventService.getEvent(eventId);

      const [owner] = await eventService.createOwners(event.id, [{
        name: payload.ownerName,
        avatarUrl: payload.avatarUrl,
        passwordHash: await bcrypt.hash(payload.ownerPassword, 10),
      }]);

      const [team] = await eventService.createTeams(event.id, [{
        name: payload.teamName,
        ownerId: owner.id,
        coinsLeft: payload.coinsLeft,
      }]);

      res.status(201).json({
        success: true,
        data: {
          owner,
          team,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async signupPlayer(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = eventIdParamSchema.parse(req.params);
      const payload = playerSignupSchema.parse(req.body);

      const isValid = await eventService.verifyEventPassword(eventId, payload.eventPassword);
      if (!isValid) {
        throw new AppError('The event password is incorrect.', 401, 'EVENT_PASSWORD_INVALID');
      }

      const event = await eventService.getEvent(eventId);
      const result = await eventService.createPlayers(event.id, [{
        name: payload.playerName,
        role: payload.playerRole,
        rankPoint: payload.rankPoint,
        basePrice: payload.basePrice,
        imageUrl: payload.imageUrl,
      }]);

      res.status(201).json({
        success: true,
        data: {
          player: result.players?.[0] || null,
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
      const { eventId } = eventIdParamSchema.parse(req.params);
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
      const { eventId } = eventIdParamSchema.parse(req.params);
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
      const { eventId } = eventIdParamSchema.parse(req.params);
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
      const { eventId } = eventIdParamSchema.parse(req.params);
      const query = playersQuerySchema.parse({
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        role: typeof req.query.role === 'string' ? req.query.role : undefined,
        status: typeof req.query.status === 'string' ? String(req.query.status).toUpperCase() : undefined,
      });

      const players = await eventService.getPlayers(eventId, {
        search: query.search,
        role: query.role,
        status: query.status,
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
      const { eventId } = eventIdParamSchema.parse(req.params);
      const query = auctionQuerySchema.parse({
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        status: typeof req.query.status === 'string' ? String(req.query.status).toUpperCase() : undefined,
        ownerName: typeof req.query.ownerName === 'string' ? req.query.ownerName : undefined,
      });

      const auctionState = await auctionService.getAuctionState(eventId, {
        search: query.search,
        status: query.status,
        ownerName: query.ownerName,
      });

      res.json({
        success: true,
        data: {
          activeAuctionId: auctionState.activeLotId,
          lotDuration: auctionState.lotDuration,
          activeLotEndsAt: auctionState.activeLotEndsAt,
          timeLeft: auctionState.timeLeft,
          lots: auctionState.lots,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
