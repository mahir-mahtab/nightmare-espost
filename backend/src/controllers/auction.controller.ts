import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { auctionService } from '../services/auctionService.js';
import {
  placeBidSchema,
  updateLotStatusSchema,
  auctionStartSchema,
  manualLotOverrideSchema,
} from '../utils/validators.js';
import { socketServer } from '../realtime/socketServer.js';

export const auctionController = {
  async getState(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const state = await auctionService.getAuctionState(eventId);
      res.json({
        success: true,
        data: state,
      });
    } catch (error) {
      next(error);
    }
  },

  async placeBid(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const body = placeBidSchema.parse(req.body);
      const session = (req as any).session;

      const ownerId = body.ownerId || session?.ownerId;
      if (!ownerId) {
        throw new AppError('Owner identity is required to place a bid.', 400, 'OWNER_ID_REQUIRED_FOR_BID');
      }

      if (session?.role !== 'owner') {
        throw new AppError('Only owner sessions are allowed to place bids.', 403, 'OWNER_ROLE_REQUIRED_FOR_BID');
      }

      if (session?.ownerId && session.ownerId !== ownerId) {
        throw new AppError('Bid request owner does not match your signed-in owner session.', 403, 'OWNER_SESSION_MISMATCH');
      }

      const bidResult = await auctionService.placeBid(eventId, ownerId, body.amount, body.lotId);

      socketServer.emitNewBid(bidResult.eventId, {
        eventId: bidResult.eventId,
        lotId: bidResult.lot.id,
        ownerId,
        amount: bidResult.lot.currentBid,
        timeLeft: bidResult.timeLeft,
        activeLotEndsAt: bidResult.activeLotEndsAt,
      });
      await socketServer.emitFullAuctionState(bidResult.eventId);

      res.json({
        success: true,
        data: bidResult,
      });
    } catch (error) {
      next(error);
    }
  },

  async markLotStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, lotId } = req.params;
      const body = updateLotStatusSchema.parse(req.body);

      const statusMap: Record<string, 'SOLD' | 'UNSOLD' | 'ACTIVE'> = {
        sold: 'SOLD',
        unsold: 'UNSOLD',
        active: 'ACTIVE',
      };

      const result = await auctionService.setLotStatus(eventId, lotId, statusMap[body.status]);

      socketServer.emitLotStatusChanged(result.eventId, {
        eventId: result.eventId,
        lot: result.lot,
      });
      await socketServer.emitFullAuctionState(result.eventId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async finalizePurchase(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, lotId } = req.params;
      const body = placeBidSchema.parse(req.body);
      const ownerId = body.ownerId || (req as any).session?.ownerId;

      if (!ownerId) {
        throw new AppError('Winning owner is required to finalize a sold lot.', 400, 'FINALIZE_OWNER_REQUIRED');
      }

      const result = await auctionService.finalizePurchase(eventId, lotId, ownerId, body.amount);

      socketServer.emitLotStatusChanged(result.eventId, {
        eventId: result.eventId,
        lot: result.lot,
      });
      await socketServer.emitFullAuctionState(result.eventId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async startAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const body = auctionStartSchema.parse(req.body || {});
      const runtime = await auctionService.startAuction(eventId, Boolean(body.autoProgress));

      socketServer.emitAuctionStarted(eventId, {
        eventId,
        firstLotId: runtime.activeLotId,
      });
      await socketServer.emitFullAuctionState(eventId);

      res.json({
        success: true,
        data: runtime,
      });
    } catch (error) {
      next(error);
    }
  },

  async stopAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const runtime = await auctionService.stopAuction(eventId);

      socketServer.emitAuctionStopped(eventId, { eventId });
      await socketServer.emitFullAuctionState(eventId);

      res.json({
        success: true,
        data: runtime,
      });
    } catch (error) {
      next(error);
    }
  },

  async nextLot(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const result = await auctionService.nextLot(eventId);

      socketServer.emitActiveLotChanged(eventId, {
        eventId,
        newLotId: result.done ? null : result.nextLotId,
      });
      await socketServer.emitFullAuctionState(eventId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async manualLotOverride(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const payload = manualLotOverrideSchema.parse(req.body);

      const result = await auctionService.manualLotOverride(eventId, payload.lotId, payload.status);

      socketServer.emitLotStatusChanged(eventId, {
        eventId,
        lot: result.lot,
      });
      socketServer.emitActiveLotChanged(eventId, {
        eventId,
        newLotId: result.runtime.activeLotId,
      });
      await socketServer.emitFullAuctionState(eventId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
