import { Request, Response, NextFunction } from 'express';
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
} from '../utils/validators.js';

export const adminController = {
  // Admin login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { password } = adminLoginSchema.parse(req.body);

      if (!authService.verifyAdminPassword(password)) {
        throw new AppError('Invalid admin password', 401);
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
      
      const createdOwners = await eventService.createOwners(eventId, owners);

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
