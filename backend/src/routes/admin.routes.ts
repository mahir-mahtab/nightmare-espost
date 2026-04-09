import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router: Router = Router();

// Public admin routes
router.post('/login', adminController.login);

// Protected admin routes
router.use(requireAdmin);

// Event management
router.post('/events', adminController.createEvent);
router.get('/events', adminController.listEvents);
router.get('/events/:eventId', adminController.getEvent);
router.get('/events/:eventId/full', adminController.getEventFull);
router.put('/events/:eventId', adminController.updateEvent);
router.delete('/events/:eventId', adminController.deleteEvent);

// Bulk data upload
router.post('/events/:eventId/teams', adminController.createTeams);
router.post('/events/:eventId/owners', adminController.createOwners);
router.post('/events/:eventId/players', adminController.createPlayers);

// Owner CRUD
router.post('/events/:eventId/owner', adminController.createOwner);
router.put('/events/:eventId/owner/:ownerId', adminController.updateOwner);
router.delete('/events/:eventId/owner/:ownerId', adminController.deleteOwner);

// Team CRUD
router.post('/events/:eventId/team', adminController.createTeam);
router.put('/events/:eventId/team/:teamId', adminController.updateTeam);
router.delete('/events/:eventId/team/:teamId', adminController.deleteTeam);

// Player CRUD
router.post('/events/:eventId/player', adminController.createPlayer);
router.put('/events/:eventId/player/:playerId', adminController.updatePlayer);
router.delete('/events/:eventId/player/:playerId', adminController.deletePlayer);

// Auction lot CRUD
router.post('/events/:eventId/lot', adminController.createAuctionLot);
router.put('/events/:eventId/lot/:lotId', adminController.updateAuctionLot);
router.delete('/events/:eventId/lot/:lotId', adminController.deleteAuctionLot);

export default router;
