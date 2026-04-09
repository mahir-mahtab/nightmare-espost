import { Router } from 'express';
import { auctionController } from '../controllers/auction.controller.js';
import { requireEventAuth, requireOwnerRole } from '../middleware/eventAuth.js';
import { requireAdmin } from '../middleware/auth.js';

const router: Router = Router();

router.get('/:eventId/state', requireEventAuth, auctionController.getState);

router.post('/:eventId/bid', requireEventAuth, requireOwnerRole, auctionController.placeBid);
router.post('/:eventId/lots/:lotId/status', requireAdmin, auctionController.markLotStatus);
router.post('/:eventId/lots/:lotId/finalize', requireAdmin, auctionController.finalizePurchase);

router.post('/:eventId/start', requireAdmin, auctionController.startAuction);
router.post('/:eventId/stop', requireAdmin, auctionController.stopAuction);
router.post('/:eventId/next-lot', requireAdmin, auctionController.nextLot);
router.post('/:eventId/manual-lot-override', requireAdmin, auctionController.manualLotOverride);

export default router;
