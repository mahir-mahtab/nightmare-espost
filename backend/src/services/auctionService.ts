import { AuctionStatus, PlayerStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { eventService } from './eventService.js';
import { logger } from '../utils/logger.js';

const redisKey = {
  state: (eventId: string) => `auction:${eventId}:state`,
  lock: (eventId: string) => `auction:${eventId}:lock`,
};

interface LiveBidSnapshot {
  ownerId: string;
  amount: number;
  updatedAt: number;
}

interface AuctionRuntimeState {
  eventId: string;
  activeLotId: string | null;
  isRunning: boolean;
  autoProgress: boolean;
  lotDuration: number;
  activeLotEndsAt: number | null;
  lastUpdatedAt: number;
  liveBids: Record<string, LiveBidSnapshot>;
}

interface AuctionBoardFilters {
  search?: string;
  status?: AuctionStatus | string;
  ownerName?: string;
}

const AUCTION_LOCK_TTL_MS = 10000;

const computeTimeLeft = (activeLotEndsAt: number | null) => {
  if (!activeLotEndsAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((activeLotEndsAt - Date.now()) / 1000));
};

const hasBidWindowClosed = (activeLotEndsAt: number, now = Date.now()) => {
  return activeLotEndsAt <= now;
};

const buildInitialState = (eventId: string, lotDuration: number): AuctionRuntimeState => ({
  eventId,
  activeLotId: null,
  isRunning: false,
  autoProgress: false,
  lotDuration,
  activeLotEndsAt: null,
  lastUpdatedAt: Date.now(),
  liveBids: {},
});

const normalizeRuntimeState = (
  raw: Partial<AuctionRuntimeState>,
  eventId: string,
  lotDuration: number,
): AuctionRuntimeState => {
  const base = buildInitialState(eventId, lotDuration);

  return {
    ...base,
    ...raw,
    eventId,
    lotDuration,
    liveBids: raw?.liveBids && typeof raw.liveBids === 'object' ? raw.liveBids : {},
  };
};

const withLock = async <T>(eventId: string, task: () => Promise<T>) => {
  const key = redisKey.lock(eventId);
  const acquired = await redis.set(key, '1', 'PX', AUCTION_LOCK_TTL_MS, 'NX');
  if (!acquired) {
    throw new AppError('Another auction action is currently being processed. Please retry in a moment.', 409, 'AUCTION_LOCKED');
  }

  try {
    return await task();
  } finally {
    await redis.del(key);
  }
};

const toBoardLot = (lot: any, runtime: AuctionRuntimeState, ownerNameById: Record<string, string>) => {
  const liveBid = runtime.liveBids[lot.id];
  const effectiveEndsAt = runtime.activeLotId === lot.id && lot.status === AuctionStatus.ACTIVE
    ? runtime.activeLotEndsAt
    : (lot.endsAt ? new Date(lot.endsAt).getTime() : null);

  if (lot.status === AuctionStatus.SOLD) {
    const finalOwnerId = lot.player?.soldToTeam?.ownerId || null;
    return {
      id: lot.id,
      playerId: lot.playerId,
      playerName: lot.player?.name,
      playerRole: lot.player?.role,
      playerImageUrl: lot.player?.imageUrl,
      currentBid: lot.player?.finalPrice ?? lot.player?.basePrice ?? 0,
      currentOwnerId: finalOwnerId,
      currentOwnerName: finalOwnerId ? (ownerNameById[finalOwnerId] || null) : null,
      status: lot.status,
      endsAt: lot.endsAt,
      timeLeft: computeTimeLeft(effectiveEndsAt),
      lotOrder: lot.lotOrder,
    };
  }

  return {
    id: lot.id,
    playerId: lot.playerId,
    playerName: lot.player?.name,
    playerRole: lot.player?.role,
    playerImageUrl: lot.player?.imageUrl,
    currentBid: liveBid?.amount ?? lot.player?.basePrice ?? 0,
    currentOwnerId: liveBid?.ownerId ?? null,
    currentOwnerName: liveBid?.ownerId ? (ownerNameById[liveBid.ownerId] || null) : null,
    status: lot.status,
    endsAt: runtime.activeLotId === lot.id ? (runtime.activeLotEndsAt ? new Date(runtime.activeLotEndsAt).toISOString() : null) : lot.endsAt,
    timeLeft: computeTimeLeft(effectiveEndsAt),
    lotOrder: lot.lotOrder,
  };
};

export const auctionService = {
  async getTickableEventIds() {
    const activeLots = await prisma.auctionLot.findMany({
      where: { status: AuctionStatus.ACTIVE },
      select: { eventId: true },
      distinct: ['eventId'],
    });

    return activeLots.map((lot) => lot.eventId);
  },

  async getRuntimeState(eventId: string, lotDuration: number) {
    const key = redisKey.state(eventId);
    const raw = await redis.get(key);

    if (!raw) {
      const initial = buildInitialState(eventId, lotDuration);
      await redis.set(key, JSON.stringify(initial));
      return initial;
    }

    try {
      return normalizeRuntimeState(JSON.parse(raw) as Partial<AuctionRuntimeState>, eventId, lotDuration);
    } catch {
      const initial = buildInitialState(eventId, lotDuration);
      await redis.set(key, JSON.stringify(initial));
      return initial;
    }
  },

  async saveRuntimeState(eventId: string, state: AuctionRuntimeState) {
    await redis.set(redisKey.state(eventId), JSON.stringify({
      ...state,
      lastUpdatedAt: Date.now(),
    }));
  },

  async logAdminAction(eventId: string, action: string, data: Prisma.InputJsonValue) {
    await prisma.actionLog.create({
      data: {
        eventId,
        action,
        data,
      },
    });
  },

  async getAuctionState(eventIdOrSlug: string, filters: AuctionBoardFilters = {}) {
    const event = await eventService.getEvent(eventIdOrSlug);
    const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

    const lots = await prisma.auctionLot.findMany({
      where: { eventId: event.id },
      include: {
        player: {
          include: {
            soldToTeam: true,
          },
        },
      },
      orderBy: { lotOrder: 'asc' },
    });

    const ownerIds = [
      ...new Set(
        Object.values(runtime.liveBids)
          .map((bid) => bid.ownerId)
          .concat(lots.map((lot) => lot.player?.soldToTeam?.ownerId).filter(Boolean) as string[]),
      ),
    ];

    const owners = ownerIds.length
      ? await prisma.owner.findMany({
        where: { eventId: event.id, id: { in: ownerIds } },
        select: { id: true, name: true },
      })
      : [];

    const ownerNameById = Object.fromEntries(owners.map((owner) => [owner.id, owner.name]));

    const normalizedSearch = filters.search?.trim().toLowerCase() || '';
    const normalizedOwnerName = filters.ownerName?.trim().toLowerCase() || '';
    const normalizedStatus = filters.status ? String(filters.status).toUpperCase() : '';

    const boardLots = lots.map((lot) => toBoardLot(lot, runtime, ownerNameById));
    const filteredLots = boardLots.filter((lot) => {
      if (normalizedSearch && !String(lot.playerName || '').toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      if (normalizedStatus && String(lot.status || '').toUpperCase() !== normalizedStatus) {
        return false;
      }

      if (normalizedOwnerName && !String(lot.currentOwnerName || '').toLowerCase().includes(normalizedOwnerName)) {
        return false;
      }

      return true;
    });

    return {
      eventId: event.id,
      activeLotId: runtime.activeLotId,
      isRunning: runtime.isRunning,
      autoProgress: runtime.autoProgress,
      lotDuration: runtime.lotDuration,
      activeLotEndsAt: runtime.activeLotEndsAt,
      timeLeft: computeTimeLeft(runtime.activeLotEndsAt),
      lots: filteredLots,
    };
  },

  async placeBid(eventIdOrSlug: string, ownerId: string, amount: number, lotId?: string) {
    const event = await eventService.getEvent(eventIdOrSlug);

    return withLock(event.id, async () => {
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      const now = Date.now();

      if (runtime.activeLotEndsAt && hasBidWindowClosed(runtime.activeLotEndsAt, now)) {
        throw new AppError('Bidding window is already closed for this lot.', 400, 'BID_WINDOW_CLOSED');
      }

      if (!runtime.isRunning) {
        throw new AppError('Auction is currently stopped. Start auction before placing bids.', 400, 'AUCTION_NOT_RUNNING');
      }

      const targetLotId = lotId || runtime.activeLotId;
      if (!targetLotId || runtime.activeLotId !== targetLotId) {
        throw new AppError('Bid can only be placed on the currently active lot.', 400, 'ACTIVE_LOT_REQUIRED');
      }

      const lot = await prisma.auctionLot.findFirst({
        where: { id: targetLotId, eventId: event.id },
        include: {
          player: true,
        },
      });

      if (!lot) {
        throw new AppError('Auction lot was not found for this event.', 404, 'AUCTION_LOT_NOT_FOUND');
      }

      if (lot.status !== AuctionStatus.ACTIVE) {
        throw new AppError('Selected lot is not active for bidding.', 400, 'LOT_NOT_ACTIVE');
      }

      const bidAcceptedAt = Date.now();
      if (!runtime.activeLotEndsAt || hasBidWindowClosed(runtime.activeLotEndsAt, bidAcceptedAt)) {
        throw new AppError('Bidding window is already closed for this lot.', 400, 'BID_WINDOW_CLOSED');
      }

      const currentBid = runtime.liveBids[lot.id]?.amount ?? lot.player.basePrice;
      if (amount <= currentBid) {
        throw new AppError('Bid amount must be greater than the current bid.', 400, 'BID_TOO_LOW');
      }

      const owner = await prisma.owner.findFirst({
        where: { id: ownerId, eventId: event.id },
      });

      if (!owner) {
        throw new AppError('Owner was not found in this event.', 404, 'OWNER_NOT_FOUND');
      }

      const team = await prisma.team.findFirst({
        where: { eventId: event.id, ownerId },
      });

      if (!team) {
        throw new AppError('Selected owner does not have a team in this event.', 400, 'OWNER_TEAM_NOT_FOUND');
      }

      if (team.coinsLeft < amount) {
        throw new AppError('Team does not have enough coins for this bid.', 400, 'INSUFFICIENT_COINS');
      }

      runtime.liveBids[lot.id] = {
        ownerId,
        amount,
        updatedAt: bidAcceptedAt,
      };
      await this.saveRuntimeState(event.id, runtime);

      return {
        eventId: event.id,
        lot: {
          id: lot.id,
          playerId: lot.playerId,
          playerName: lot.player.name,
          currentBid: amount,
          currentOwnerId: ownerId,
          currentOwnerName: owner.name,
          status: lot.status,
          endsAt: runtime.activeLotEndsAt ? new Date(runtime.activeLotEndsAt).toISOString() : null,
          timeLeft: computeTimeLeft(runtime.activeLotEndsAt),
          lotOrder: lot.lotOrder,
        },
        timeLeft: computeTimeLeft(runtime.activeLotEndsAt),
        activeLotEndsAt: runtime.activeLotEndsAt,
      };
    });
  },

  async settleLot(
    event: { id: string; auctionWindowSeconds: number },
    lotId: string,
    runtime: AuctionRuntimeState,
    options: {
      forcedStatus?: 'SOLD' | 'UNSOLD';
      overrideOwnerId?: string;
      overrideAmount?: number;
    } = {},
  ) {
    const lot = await prisma.auctionLot.findFirst({
      where: { id: lotId, eventId: event.id },
      include: {
        player: true,
      },
    });

    if (!lot) {
      throw new AppError('Auction lot was not found for this event.', 404, 'AUCTION_LOT_NOT_FOUND');
    }

    if (lot.status === AuctionStatus.SOLD || lot.status === AuctionStatus.UNSOLD) {
      delete runtime.liveBids[lot.id];
      return {
        settled: false,
        lot,
      };
    }

    const liveBidSnapshot = runtime.liveBids[lot.id]
      ? { ...runtime.liveBids[lot.id] }
      : null;
    const finalOwnerId = options.overrideOwnerId ?? liveBidSnapshot?.ownerId ?? null;
    const finalAmount = options.overrideAmount ?? liveBidSnapshot?.amount ?? lot.player.basePrice;
    const finalStatus = options.forcedStatus || (finalOwnerId ? 'SOLD' : 'UNSOLD');

    if (finalStatus === 'SOLD' && !finalOwnerId) {
      throw new AppError('Cannot mark lot as sold without a winning owner.', 400, 'WINNING_OWNER_REQUIRED');
    }

    let winningTeamId: string | null = null;

    if (finalStatus === 'SOLD') {
      const team = await prisma.team.findFirst({
        where: { eventId: event.id, ownerId: finalOwnerId || undefined },
      });

      if (!team) {
        throw new AppError('Winning owner does not have a team in this event.', 400, 'WINNING_TEAM_NOT_FOUND');
      }

      if (team.coinsLeft < finalAmount) {
        throw new AppError('Winning team does not have enough coins for this purchase.', 400, 'WINNING_TEAM_INSUFFICIENT_COINS');
      }

      winningTeamId = team.id;
    }

    await prisma.$transaction(async (tx) => {
      if (finalStatus === 'SOLD' && winningTeamId) {
        await tx.team.update({
          where: { id: winningTeamId },
          data: {
            coinsLeft: { decrement: finalAmount },
          },
        });
      }

      await tx.player.update({
        where: { id: lot.playerId },
        data: finalStatus === 'SOLD'
          ? {
            status: PlayerStatus.SOLD,
            soldToTeamId: winningTeamId,
            finalPrice: finalAmount,
          }
          : {
            status: PlayerStatus.UNSOLD,
            soldToTeamId: null,
            finalPrice: null,
          },
      });

      await tx.auctionLot.update({
        where: { id: lot.id },
        data: {
          status: finalStatus === 'SOLD' ? AuctionStatus.SOLD : AuctionStatus.UNSOLD,
          endsAt: null,
        },
      });
    });

    logger.info(`[auction:settle] event=${event.id} lot=${lot.id} status=${finalStatus} winnerOwnerId=${finalOwnerId || 'none'} amount=${finalAmount} activeLotEndsAt=${runtime.activeLotEndsAt || 'none'} settledAt=${Date.now()} bidSnapshotUpdatedAt=${liveBidSnapshot?.updatedAt || 'none'}`);

    delete runtime.liveBids[lot.id];

    const updatedLot = await prisma.auctionLot.findFirst({
      where: { id: lot.id, eventId: event.id },
      include: {
        player: {
          include: {
            soldToTeam: true,
          },
        },
      },
    });

    return {
      settled: true,
      lot: updatedLot,
    };
  },

  async setLotStatus(eventIdOrSlug: string, lotId: string, status: 'SOLD' | 'UNSOLD' | 'ACTIVE') {
    const event = await eventService.getEvent(eventIdOrSlug);

    return withLock(event.id, async () => {
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      const lot = await prisma.auctionLot.findFirst({
        where: { id: lotId, eventId: event.id },
      });

      if (!lot) {
        throw new AppError('Auction lot was not found for this event.', 404, 'AUCTION_LOT_NOT_FOUND');
      }

      if (
        status === 'ACTIVE'
        && (lot.status === AuctionStatus.SOLD || lot.status === AuctionStatus.UNSOLD)
      ) {
        throw new AppError('Finished lots cannot be activated again.', 400, 'LOT_ALREADY_FINALIZED');
      }

      if (status === 'ACTIVE') {
        const endsAtMs = Date.now() + (event.auctionWindowSeconds * 1000);

        await prisma.$transaction([
          prisma.auctionLot.updateMany({
            where: { eventId: event.id, status: AuctionStatus.ACTIVE, id: { not: lot.id } },
            data: { status: AuctionStatus.PENDING, endsAt: null },
          }),
          prisma.auctionLot.update({
            where: { id: lot.id },
            data: {
              status: AuctionStatus.ACTIVE,
              endsAt: new Date(endsAtMs),
            },
          }),
          prisma.player.update({
            where: { id: lot.playerId },
            data: {
              status: PlayerStatus.ACTIVE,
              soldToTeamId: null,
              finalPrice: null,
            },
          }),
        ]);

        delete runtime.liveBids[lot.id];
        runtime.activeLotId = lot.id;
        runtime.activeLotEndsAt = endsAtMs;
        runtime.isRunning = true;
        await this.saveRuntimeState(event.id, runtime);
      } else {
        await this.settleLot(event, lot.id, runtime, {
          forcedStatus: status,
        });

        if (runtime.activeLotId === lot.id) {
          runtime.activeLotId = null;
          runtime.activeLotEndsAt = null;
          runtime.isRunning = false;
        }

        await this.saveRuntimeState(event.id, runtime);
      }

      const state = await this.getAuctionState(event.id);
      const nextLot = state.lots.find((item: any) => item.id === lot.id);

      return {
        eventId: event.id,
        lot: nextLot,
      };
    });
  },

  async finalizePurchase(eventIdOrSlug: string, lotId: string, ownerId: string, amount: number, adminIdentity: string) {
    const event = await eventService.getEvent(eventIdOrSlug);

    return withLock(event.id, async () => {
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      const lotBefore = await prisma.auctionLot.findFirst({
        where: { id: lotId, eventId: event.id },
        include: {
          player: {
            include: {
              soldToTeam: true,
            },
          },
        },
      });

      if (!lotBefore) {
        throw new AppError('Auction lot was not found for this event.', 404, 'AUCTION_LOT_NOT_FOUND');
      }

      await this.settleLot(event, lotId, runtime, {
        forcedStatus: 'SOLD',
        overrideOwnerId: ownerId,
        overrideAmount: amount,
      });

      if (runtime.activeLotId === lotId) {
        runtime.activeLotId = null;
        runtime.activeLotEndsAt = null;
        runtime.isRunning = false;
      }

      await this.saveRuntimeState(event.id, runtime);

      const state = await this.getAuctionState(event.id);
      const lot = state.lots.find((item: any) => item.id === lotId) || null;

      await this.logAdminAction(event.id, 'EMERGENCY_OVERRIDE_FINALIZE', {
        admin: adminIdentity,
        lotId,
        previousStatus: lotBefore.status,
        previousOwnerId: lotBefore.player?.soldToTeam?.ownerId || null,
        previousAmount: lotBefore.player?.finalPrice ?? null,
        overrideOwnerId: ownerId,
        overrideAmount: amount,
        activeLotAtAction: runtime.activeLotId,
      });

      return {
        eventId: event.id,
        lot,
        player: null,
      };
    });
  },

  async startAuction(eventId: string, autoProgress = false) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);

      const firstPendingLot = await prisma.auctionLot.findFirst({
        where: { eventId: event.id, status: AuctionStatus.PENDING },
        orderBy: { lotOrder: 'asc' },
      });

      const activeLot = await prisma.auctionLot.findFirst({
        where: { eventId: event.id, status: AuctionStatus.ACTIVE },
        orderBy: { lotOrder: 'asc' },
      });

      const lotToActivate = activeLot || firstPendingLot;
      if (!lotToActivate) {
        throw new AppError('No pending lot is available to start the auction.', 400, 'NO_LOT_TO_START');
      }

      const endsAtMs = Date.now() + (event.auctionWindowSeconds * 1000);
      if (lotToActivate.status !== AuctionStatus.ACTIVE || !lotToActivate.endsAt) {
        await prisma.auctionLot.update({
          where: { id: lotToActivate.id },
          data: {
            status: AuctionStatus.ACTIVE,
            endsAt: new Date(endsAtMs),
          },
        });
      }

      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      runtime.activeLotId = lotToActivate.id;
      runtime.activeLotEndsAt = lotToActivate.endsAt
        ? new Date(lotToActivate.endsAt).getTime()
        : endsAtMs;
      runtime.isRunning = true;
      runtime.autoProgress = autoProgress;
      runtime.lotDuration = event.auctionWindowSeconds;
      delete runtime.liveBids[lotToActivate.id];

      await this.saveRuntimeState(event.id, runtime);
      await prisma.event.update({ where: { id: event.id }, data: { status: 'LIVE' } });

      return runtime;
    });
  },

  async stopAuction(eventId: string) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

      runtime.isRunning = false;
      runtime.autoProgress = false;
      runtime.activeLotEndsAt = null;
      await this.saveRuntimeState(event.id, runtime);

      if (runtime.activeLotId) {
        await prisma.auctionLot.updateMany({
          where: { eventId: event.id, id: runtime.activeLotId, status: AuctionStatus.ACTIVE },
          data: { endsAt: null },
        });
      }

      return runtime;
    });
  },

  async _progressToNextLot(event: { id: string; auctionWindowSeconds: number }, runtime: AuctionRuntimeState) {
    const currentLotId = runtime.activeLotId;
    if (!currentLotId) {
      throw new AppError('There is no active lot to progress from.', 400, 'NO_ACTIVE_LOT');
    }

    const current = await prisma.auctionLot.findFirst({
      where: { id: currentLotId, eventId: event.id },
    });

    if (!current) {
      throw new AppError('Current active lot was not found in database.', 404, 'ACTIVE_LOT_NOT_FOUND');
    }

    if (current.status === AuctionStatus.ACTIVE) {
      await this.settleLot(event, current.id, runtime);
    }

    const next = await prisma.auctionLot.findFirst({
      where: {
        eventId: event.id,
        lotOrder: { gt: current.lotOrder },
        status: { in: [AuctionStatus.PENDING, AuctionStatus.ACTIVE] },
      },
      orderBy: { lotOrder: 'asc' },
    });

    if (!next) {
      runtime.isRunning = false;
      runtime.autoProgress = false;
      runtime.activeLotId = null;
      runtime.activeLotEndsAt = null;
      await this.saveRuntimeState(event.id, runtime);
      await prisma.event.update({ where: { id: event.id }, data: { status: 'COMPLETED' } });
      return { done: true, runtime };
    }

    const nextEndsAtMs = Date.now() + (event.auctionWindowSeconds * 1000);
    await prisma.auctionLot.update({
      where: { id: next.id },
      data: { status: AuctionStatus.ACTIVE, endsAt: new Date(nextEndsAtMs) },
    });

    delete runtime.liveBids[next.id];
    runtime.activeLotId = next.id;
    runtime.activeLotEndsAt = nextEndsAtMs;
    runtime.isRunning = true;
    await this.saveRuntimeState(event.id, runtime);

    return { done: false, runtime, nextLotId: next.id };
  },

  async nextLot(eventId: string) {
    return this.activateNextLot(eventId);
  },

  async settleCurrentLot(eventId: string) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

      if (!runtime.activeLotId) {
        throw new AppError('There is no active lot to settle.', 400, 'NO_ACTIVE_LOT');
      }

      const activeLotId = runtime.activeLotId;
      await this.settleLot(event, activeLotId, runtime);

      runtime.activeLotId = null;
      runtime.activeLotEndsAt = null;
      runtime.isRunning = false;
      await this.saveRuntimeState(event.id, runtime);

      const state = await this.getAuctionState(event.id);
      const lot = state.lots.find((item: any) => item.id === activeLotId) || null;

      return {
        eventId: event.id,
        lot,
      };
    });
  },

  async activateNextLot(eventId: string) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

      if (runtime.activeLotId) {
        throw new AppError('Settle current lot before activating next lot.', 400, 'ACTIVE_LOT_EXISTS');
      }

      const nextPendingLot = await prisma.auctionLot.findFirst({
        where: { eventId: event.id, status: AuctionStatus.PENDING },
        orderBy: { lotOrder: 'asc' },
      });

      if (!nextPendingLot) {
        runtime.isRunning = false;
        runtime.autoProgress = false;
        runtime.activeLotEndsAt = null;
        await this.saveRuntimeState(event.id, runtime);
        await prisma.event.update({ where: { id: event.id }, data: { status: 'COMPLETED' } });

        return {
          done: true,
          nextLotId: null,
          runtime,
        };
      }

      const nextEndsAtMs = Date.now() + (event.auctionWindowSeconds * 1000);
      await prisma.$transaction([
        prisma.auctionLot.updateMany({
          where: { eventId: event.id, status: AuctionStatus.ACTIVE },
          data: { status: AuctionStatus.PENDING, endsAt: null },
        }),
        prisma.auctionLot.update({
          where: { id: nextPendingLot.id },
          data: {
            status: AuctionStatus.ACTIVE,
            endsAt: new Date(nextEndsAtMs),
          },
        }),
        prisma.player.update({
          where: { id: nextPendingLot.playerId },
          data: {
            status: PlayerStatus.ACTIVE,
            soldToTeamId: null,
            finalPrice: null,
          },
        }),
      ]);

      delete runtime.liveBids[nextPendingLot.id];
      runtime.activeLotId = nextPendingLot.id;
      runtime.activeLotEndsAt = nextEndsAtMs;
      runtime.isRunning = true;
      await this.saveRuntimeState(event.id, runtime);
      await prisma.event.update({ where: { id: event.id }, data: { status: 'LIVE' } });

      return {
        done: false,
        nextLotId: nextPendingLot.id,
        runtime,
      };
    });
  },

  async resetLotToPending(eventId: string, lotId: string) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

      const lot = await prisma.auctionLot.findFirst({
        where: { id: lotId, eventId: event.id },
        include: {
          player: true,
        },
      });

      if (!lot) {
        throw new AppError('Auction lot was not found for this event.', 404, 'AUCTION_LOT_NOT_FOUND');
      }

      if (lot.status === AuctionStatus.ACTIVE) {
        throw new AppError('Active lot cannot be reset. Settle it first.', 400, 'ACTIVE_LOT_RESET_NOT_ALLOWED');
      }

      if (lot.status === AuctionStatus.PENDING) {
        const state = await this.getAuctionState(event.id);
        const unchangedLot = state.lots.find((item: any) => item.id === lot.id) || null;
        return {
          eventId: event.id,
          lot: unchangedLot,
          refunded: false,
        };
      }

      const soldTeamId = lot.player?.soldToTeamId || null;
      const soldFinalPrice = lot.player?.finalPrice || 0;

      await prisma.$transaction(async (tx) => {
        if (lot.status === AuctionStatus.SOLD && soldTeamId && soldFinalPrice > 0) {
          await tx.team.update({
            where: { id: soldTeamId },
            data: {
              coinsLeft: { increment: soldFinalPrice },
            },
          });
        }

        await tx.player.update({
          where: { id: lot.playerId },
          data: {
            status: PlayerStatus.ACTIVE,
            soldToTeamId: null,
            finalPrice: null,
          },
        });

        await tx.auctionLot.update({
          where: { id: lot.id },
          data: {
            status: AuctionStatus.PENDING,
            endsAt: null,
          },
        });
      });

      delete runtime.liveBids[lot.id];
      if (runtime.activeLotId === lot.id) {
        runtime.activeLotId = null;
        runtime.activeLotEndsAt = null;
        runtime.isRunning = false;
      }
      await this.saveRuntimeState(event.id, runtime);

      const state = await this.getAuctionState(event.id);
      const updatedLot = state.lots.find((item: any) => item.id === lot.id) || null;

      return {
        eventId: event.id,
        lot: updatedLot,
        refunded: Boolean(lot.status === AuctionStatus.SOLD && soldTeamId && soldFinalPrice > 0),
      };
    });
  },

  async manualLotOverride(eventId: string, lotId: string, status: 'ACTIVE' | 'SOLD' | 'UNSOLD') {
    const event = await eventService.getEventById(eventId);

    return withLock(event.id, async () => {
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      const lot = await prisma.auctionLot.findFirst({
        where: { id: lotId, eventId: event.id },
      });

      if (!lot) {
        throw new AppError('Auction lot was not found for this event.', 404, 'AUCTION_LOT_NOT_FOUND');
      }

      if (
        status === 'ACTIVE'
        && (lot.status === AuctionStatus.SOLD || lot.status === AuctionStatus.UNSOLD)
      ) {
        throw new AppError('Finished lots cannot be activated again.', 400, 'LOT_ALREADY_FINALIZED');
      }

      if (status === 'ACTIVE') {
        const endsAtMs = Date.now() + (event.auctionWindowSeconds * 1000);

        await prisma.$transaction([
          prisma.auctionLot.updateMany({
            where: {
              eventId: event.id,
              status: AuctionStatus.ACTIVE,
              id: { not: lot.id },
            },
            data: { status: AuctionStatus.PENDING, endsAt: null },
          }),
          prisma.auctionLot.update({
            where: { id: lot.id },
            data: { status: AuctionStatus.ACTIVE, endsAt: new Date(endsAtMs) },
          }),
          prisma.player.update({
            where: { id: lot.playerId },
            data: { status: PlayerStatus.ACTIVE, soldToTeamId: null, finalPrice: null },
          }),
        ]);

        delete runtime.liveBids[lot.id];
        runtime.activeLotId = lot.id;
        runtime.activeLotEndsAt = endsAtMs;
        runtime.isRunning = true;
      } else {
        await this.settleLot(event, lot.id, runtime, { forcedStatus: status });

        if (runtime.activeLotId === lot.id) {
          runtime.activeLotId = null;
          runtime.activeLotEndsAt = null;
          runtime.isRunning = false;
        }
      }

      await this.saveRuntimeState(event.id, runtime);

      const state = await this.getAuctionState(event.id);
      const currentLot = state.lots.find((item: any) => item.id === lot.id) || null;

      return {
        runtime,
        lot: currentLot,
      };
    });
  },

  async updateRuntimeSettings(eventId: string, settings: { autoProgress?: boolean }) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

      if (typeof settings.autoProgress === 'boolean') {
        runtime.autoProgress = settings.autoProgress;
      }

      await this.saveRuntimeState(event.id, runtime);
      return runtime;
    });
  },

  async extendActiveLotTimer(eventId: string, seconds: number) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

      if (!runtime.isRunning) {
        throw new AppError('Auction is currently stopped. Start auction before extending timer.', 400, 'AUCTION_NOT_RUNNING');
      }

      if (!runtime.activeLotId) {
        throw new AppError('There is no active lot to extend timer for.', 400, 'NO_ACTIVE_LOT');
      }

      const activeLot = await prisma.auctionLot.findFirst({
        where: { id: runtime.activeLotId, eventId: event.id },
      });

      if (!activeLot) {
        throw new AppError('Current active lot was not found in database.', 404, 'ACTIVE_LOT_NOT_FOUND');
      }

      if (activeLot.status !== AuctionStatus.ACTIVE) {
        throw new AppError('Selected lot is not active for timer extension.', 400, 'LOT_NOT_ACTIVE');
      }

      const baseEndsAt = runtime.activeLotEndsAt
        || (activeLot.endsAt ? activeLot.endsAt.getTime() : Date.now() + (event.auctionWindowSeconds * 1000));
      const extendedEndsAt = baseEndsAt + (seconds * 1000);

      runtime.activeLotEndsAt = extendedEndsAt;
      await this.saveRuntimeState(event.id, runtime);

      await prisma.auctionLot.update({
        where: { id: activeLot.id },
        data: { endsAt: new Date(extendedEndsAt) },
      });

      return {
        eventId: event.id,
        activeLotId: activeLot.id,
        activeLotEndsAt: extendedEndsAt,
        timeLeft: computeTimeLeft(extendedEndsAt),
      };
    });
  },

  async tickAuction(eventId: string) {
    const event = await eventService.getEventById(eventId);

    return withLock(event.id, async () => {
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      if (!runtime.isRunning || !runtime.activeLotId) {
        return {
          runtime,
          progressed: false,
          previousActiveLotId: runtime.activeLotId,
          nextActiveLotId: runtime.activeLotId,
        };
      }

      const previousActiveLotId = runtime.activeLotId;
      const now = Date.now();
      const nextTimeLeft = computeTimeLeft(runtime.activeLotEndsAt);
      const hasExpired = Boolean(runtime.activeLotEndsAt && runtime.activeLotEndsAt <= now);

      if (hasExpired || nextTimeLeft === 0) {
        if (!runtime.autoProgress) {
          const current = await prisma.auctionLot.findFirst({
            where: { id: previousActiveLotId, eventId: event.id },
          });

          if (current && current.status === AuctionStatus.ACTIVE) {
            await this.settleLot(event, current.id, runtime);
          }

          runtime.isRunning = false;
          runtime.activeLotId = null;
          runtime.activeLotEndsAt = null;
          await this.saveRuntimeState(event.id, runtime);

          return {
            runtime,
            progressed: true,
            previousActiveLotId,
            nextActiveLotId: null,
          };
        }

        const progression = await this._progressToNextLot(event, runtime);
        const refreshedRuntime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

        return {
          runtime: refreshedRuntime,
          progressed: true,
          previousActiveLotId,
          nextActiveLotId: progression.done ? null : (progression.nextLotId || null),
        };
      }

      return {
        runtime,
        progressed: false,
        previousActiveLotId,
        nextActiveLotId: runtime.activeLotId,
      };
    });
  },
};
