import { Router } from 'express';
import { eventsController } from '../controllers/events.controller.js';
import { requireEventAuth } from '../middleware/eventAuth.js';

const router: Router = Router();

router.get('/', eventsController.listPublicEvents);
router.get('/:eventId/login-context', eventsController.getLoginContext);
router.get('/:eventId/signup-context', eventsController.getSignupContext);

// Auth routes (public)
router.post('/:eventId/auth/login', eventsController.login);
router.post('/:eventId/signup/owner', eventsController.signupOwner);
router.post('/:eventId/signup/player', eventsController.signupPlayer);

// Protected routes (require event session)
router.post('/:eventId/auth/validate', requireEventAuth, eventsController.validateSession);
router.post('/:eventId/auth/logout', requireEventAuth, eventsController.logout);

// Event data routes
router.get('/:eventId/summary', requireEventAuth, eventsController.getEventSummary);
router.get('/:eventId/teams', requireEventAuth, eventsController.getTeams);
router.get('/:eventId/owners', requireEventAuth, eventsController.getOwners);
router.get('/:eventId/players', requireEventAuth, eventsController.getPlayers);
router.get('/:eventId/auction', requireEventAuth, eventsController.getAuctionBoard);

export default router;
