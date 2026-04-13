import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { authService } from '../services/authService.js';
import { eventService } from '../services/eventService.js';
import { AppError } from '../middleware/errorHandler.js';
import { parseDataFile } from '../utils/csvParser.js';
import {
  adminLoginSchema,
  createEventSchema,
  updateEventSchema,
  bulkTeamsSchema,
  bulkOwnersSchema,
  bulkPlayersSchema,
  createOwnerSchema,
  updateOwnerSchema,
  createTeamSchema,
  updateTeamSchema,
  createPlayerSchema,
  updatePlayerSchema,
  createAuctionLotSchema,
  updateAuctionLotSchema,
} from '../utils/validators.js';

export const adminController = {
  // Admin login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { password } = adminLoginSchema.parse(req.body);

      if (!authService.verifyAdminPassword(password)) {
        throw new AppError('The admin password is incorrect.', 401, 'ADMIN_PASSWORD_INVALID');
      }

      const token = authService.generateAdminToken();

      res.json({
        success: true,
        data: { token },
      });
    } catch (error) {
      next(error);
    }
  },

  // Create event
  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const eventData = createEventSchema.parse(req.body);
      const event = await eventService.createEvent(eventData);

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // List events
  async listEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      const events = await eventService.listEvents(status as any);

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get event
  async getEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const event = await eventService.getEventById(eventId);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get full event workspace data
  async getEventFull(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const event = await eventService.getEventFullForAdmin(eventId);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update event
  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const eventData = updateEventSchema.parse(req.body);
      const event = await eventService.updateEvent(eventId, eventData);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete event
  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      await eventService.deleteEvent(eventId);

      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Create teams (bulk)
  async createTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      
      // Support both JSON and CSV input
      let teams;
      if (typeof req.body === 'string') {
        // CSV or JSON string from file upload
        const parsed = await parseDataFile(req.body);
        teams = bulkTeamsSchema.parse(parsed);
      } else {
        // Direct JSON body
        teams = bulkTeamsSchema.parse(req.body);
      }
      
      const createdTeams = await eventService.createTeams(eventId, teams);

      res.status(201).json({
        success: true,
        data: createdTeams,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create owner
  async createOwner(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const ownerData = createOwnerSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(ownerData.password, 10);
      const [owner] = await eventService.createOwners(eventId, [{
        name: ownerData.name,
        avatarUrl: ownerData.avatarUrl,
        passwordHash,
      }]);

      res.status(201).json({
        success: true,
        data: owner,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update owner
  async updateOwner(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, ownerId } = req.params;
      const ownerData = updateOwnerSchema.parse(req.body);
      const payload: any = {
        ...(ownerData.name !== undefined ? { name: ownerData.name } : {}),
        ...(ownerData.avatarUrl !== undefined ? { avatarUrl: ownerData.avatarUrl } : {}),
      };

      if (ownerData.password !== undefined) {
        payload.passwordHash = await bcrypt.hash(ownerData.password, 10);
      }

      const owner = await eventService.updateOwner(eventId, ownerId, payload);

      res.json({
        success: true,
        data: owner,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete owner
  async deleteOwner(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, ownerId } = req.params;
      await eventService.deleteOwner(eventId, ownerId);

      res.json({
        success: true,
        message: 'Owner deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Create team
  async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const teamData = createTeamSchema.parse(req.body);
      const [team] = await eventService.createTeams(eventId, [teamData]);

      res.status(201).json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update team
  async updateTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, teamId } = req.params;
      const teamData = updateTeamSchema.parse(req.body);
      const team = await eventService.updateTeam(eventId, teamId, teamData);

      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete team
  async deleteTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, teamId } = req.params;
      await eventService.deleteTeam(eventId, teamId);

      res.json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Create player
  async createPlayer(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const playerData = createPlayerSchema.parse(req.body);
      const result = await eventService.createPlayers(eventId, [playerData]);
      const createdPlayer = result.players?.[0];

      res.status(201).json({
        success: true,
        data: createdPlayer,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update player
  async updatePlayer(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, playerId } = req.params;
      const playerData = updatePlayerSchema.parse(req.body);
      const player = await eventService.updatePlayer(eventId, playerId, playerData);

      res.json({
        success: true,
        data: player,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete player
  async deletePlayer(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, playerId } = req.params;
      await eventService.deletePlayer(eventId, playerId);

      res.json({
        success: true,
        message: 'Player deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Create auction lot
  async createAuctionLot(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const lotData = createAuctionLotSchema.parse(req.body);
      const lot = await eventService.createAuctionLot(eventId, lotData);

      res.status(201).json({
        success: true,
        data: lot,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update auction lot
  async updateAuctionLot(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, lotId } = req.params;
      const lotData = updateAuctionLotSchema.parse(req.body);
      const lot = await eventService.updateAuctionLot(eventId, lotId, lotData);

      res.json({
        success: true,
        data: lot,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete auction lot
  async deleteAuctionLot(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, lotId } = req.params;
      await eventService.deleteAuctionLot(eventId, lotId);

      res.json({
        success: true,
        message: 'Auction lot deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Create owners (bulk)
  async createOwners(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      
      // Support both JSON and CSV input
      let owners;
      if (typeof req.body === 'string') {
        // CSV or JSON string from file upload
        const parsed = await parseDataFile(req.body);
        owners = bulkOwnersSchema.parse(parsed);
      } else {
        // Direct JSON body
        owners = bulkOwnersSchema.parse(req.body);
      }
      
      const ownersWithHashes = await Promise.all(
        owners.map(async (owner) => ({
          name: owner.name,
          avatarUrl: owner.avatarUrl,
          passwordHash: await bcrypt.hash(owner.password, 10),
        })),
      );

      const createdOwners = await eventService.createOwners(eventId, ownersWithHashes);

      res.status(201).json({
        success: true,
        data: createdOwners,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create players (bulk)
  async createPlayers(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      
      // Support both JSON and CSV input
      let players;
      if (typeof req.body === 'string') {
        // CSV or JSON string from file upload
        const parsed = await parseDataFile(req.body);
        players = bulkPlayersSchema.parse(parsed);
      } else {
        // Direct JSON body
        players = bulkPlayersSchema.parse(req.body);
      }
      
      const result = await eventService.createPlayers(eventId, players);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
