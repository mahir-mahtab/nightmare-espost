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
router.put('/events/:eventId', adminController.updateEvent);
router.delete('/events/:eventId', adminController.deleteEvent);

// Bulk data upload
router.post('/events/:eventId/teams', adminController.createTeams);
router.post('/events/:eventId/owners', adminController.createOwners);
router.post('/events/:eventId/players', adminController.createPlayers);

export default router;
