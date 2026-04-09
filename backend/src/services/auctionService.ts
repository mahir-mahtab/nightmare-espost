import { AuctionStatus, PlayerStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { eventService } from './eventService.js';

const redisKey = {
  state: (eventId: string) => `auction:${eventId}:state`,
  lock: (eventId: string) => `auction:${eventId}:lock`,
};

interface AuctionRuntimeState {
  eventId: string;
  activeLotId: string | null;
  isRunning: boolean;
  autoProgress: boolean;
  lotDuration: number;
  activeLotEndsAt: number | null;
  timeLeft: number;
  lastUpdatedAt: number;
  liveBids: Record<string, LiveBidSnapshot>;
}

interface LiveBidSnapshot {
  ownerId: string;
  amount: number;
  updatedAt: number;
}

const buildInitialState = (eventId: string, lotDuration: number): AuctionRuntimeState => ({
  eventId,
  activeLotId: null,
  isRunning: false,
  autoProgress: false,
  lotDuration,
  activeLotEndsAt: null,
  timeLeft: lotDuration,
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

const computeTimeLeft = (activeLotEndsAt: number | null) => {
  if (!activeLotEndsAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((activeLotEndsAt - Date.now()) / 1000));
};

const withLock = async <T>(eventId: string, task: () => Promise<T>) => {
  const key = redisKey.lock(eventId);
  const acquired = await redis.set(key, '1', 'PX', 3000, 'NX');
  if (!acquired) {
    throw new AppError('Auction action in progress, retry', 409);
  }

  try {
    return await task();
  } finally {
    await redis.del(key);
  }
};

const toBoardLot = (lot: any, liveBid?: LiveBidSnapshot, liveOwnerName?: string) => ({
  id: lot.id,
  playerId: lot.playerId,
  playerName: lot.player?.name,
  currentBid: liveBid?.amount ?? lot.currentBid,
  currentOwnerId: liveBid?.ownerId ?? lot.currentOwnerId,
  currentOwnerName: liveBid ? (liveOwnerName || lot.currentOwner?.name) : lot.currentOwner?.name,
  status: lot.status,
  timeLeft: lot.timeLeft,
  lotOrder: lot.lotOrder,
});

export const auctionService = {
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

  async mergeLiveBidsIntoLots(eventId: string, lots: any[], runtime: AuctionRuntimeState) {
    const liveBids = runtime.liveBids || {};
    const liveOwnerIds = [
      ...new Set(
        Object.values(liveBids)
          .map((item) => item?.ownerId)
          .filter(Boolean),
      ),
    ] as string[];

    const owners = liveOwnerIds.length
      ? await prisma.owner.findMany({
        where: {
          eventId,
          id: { in: liveOwnerIds },
        },
        select: {
          id: true,
          name: true,
        },
      })
      : [];

    const ownerNameById = Object.fromEntries(owners.map((owner) => [owner.id, owner.name]));

    return (lots || []).map((lot) => {
      const liveBid = liveBids[lot.id];
      if (!liveBid) {
        return lot;
      }

      return {
        ...lot,
        currentBid: liveBid.amount,
        currentOwnerId: liveBid.ownerId,
        currentOwnerName: ownerNameById[liveBid.ownerId] || lot.currentOwnerName || null,
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
        currentOwner: true,
      },
    });

    if (!lot) {
      throw new AppError('Auction lot not found', 404);
    }

    if (lot.status === AuctionStatus.SOLD || lot.status === AuctionStatus.UNSOLD) {
      delete runtime.liveBids[lot.id];
      return {
        lot: toBoardLot(lot),
        settled: false,
        alreadySettled: true,
      };
    }

    const liveBid = runtime.liveBids[lot.id];
    const finalOwnerId = options.overrideOwnerId ?? liveBid?.ownerId ?? lot.currentOwnerId ?? null;
    const finalAmount = options.overrideAmount ?? liveBid?.amount ?? lot.currentBid;
    const finalStatus = options.forcedStatus || (finalOwnerId ? AuctionStatus.SOLD : AuctionStatus.UNSOLD);

    if (finalStatus === AuctionStatus.SOLD && !finalOwnerId) {
      throw new AppError('Cannot settle SOLD without a winning owner', 400);
    }

    const { updatedLot, player } = await prisma.$transaction(async (tx) => {
      let winningTeamId: string | null = null;

      if (finalStatus === AuctionStatus.SOLD) {
        const team = await tx.team.findFirst({
          where: { eventId: event.id, ownerId: finalOwnerId || undefined },
        });

        if (!team) {
          throw new AppError('Winning owner team not found', 400);
        }

        if (team.coinsLeft < finalAmount) {
          throw new AppError('Winning team has insufficient coins', 400);
        }

        await tx.team.update({
          where: { id: team.id },
          data: {
            coinsLeft: {
              decrement: finalAmount,
            },
          },
        });

        winningTeamId = team.id;
      }

      const updatedLotRecord = await tx.auctionLot.update({
        where: { id: lot.id },
        data: {
          currentBid: finalAmount,
          currentOwnerId: finalStatus === AuctionStatus.SOLD ? finalOwnerId : null,
          status: finalStatus,
          timeLeft: 0,
        },
        include: {
          player: true,
          currentOwner: true,
        },
      });

      const updatedPlayer = await tx.player.update({
        where: { id: lot.playerId },
        data: finalStatus === AuctionStatus.SOLD
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

      return {
        updatedLot: updatedLotRecord,
        player: updatedPlayer,
      };
    });

    delete runtime.liveBids[lot.id];

    return {
      lot: toBoardLot(updatedLot),
      player,
      settled: true,
      alreadySettled: false,
    };
  },

  async saveRuntimeState(eventId: string, state: AuctionRuntimeState) {
    await redis.set(redisKey.state(eventId), JSON.stringify({
      ...state,
      lastUpdatedAt: Date.now(),
    }));
  },

  async getAuctionState(eventIdOrSlug: string) {
    const event = await eventService.getEvent(eventIdOrSlug);
    const board = await eventService.getAuctionBoard(event.id);
    const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
    const lots = await this.mergeLiveBidsIntoLots(event.id, board.lots, runtime);

    return {
      eventId: event.id,
      activeLotId: runtime.activeLotId,
      isRunning: runtime.isRunning,
      autoProgress: runtime.autoProgress,
      lotDuration: runtime.lotDuration,
      activeLotEndsAt: runtime.activeLotEndsAt,
      timeLeft: computeTimeLeft(runtime.activeLotEndsAt),
      lots,
    };
  },

  async placeBid(eventIdOrSlug: string, ownerId: string, amount: number, lotId?: string) {
    const event = await eventService.getEvent(eventIdOrSlug);

    return withLock(event.id, async () => {
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      if (!runtime.isRunning) {
        throw new AppError('Auction is not running', 400);
      }

      const targetLotId = lotId || runtime.activeLotId;
      if (!targetLotId) {
        throw new AppError('No active lot found', 400);
      }

      const lot = await prisma.auctionLot.findFirst({
        where: { id: targetLotId, eventId: event.id },
      });

      if (!lot) {
        throw new AppError('Auction lot not found', 404);
      }

      if (lot.status !== AuctionStatus.ACTIVE) {
        throw new AppError('Lot is not active for bidding', 400);
      }

      const liveBid = runtime.liveBids[targetLotId];
      const currentBid = liveBid?.amount ?? lot.currentBid;

      if (amount <= currentBid) {
        throw new AppError('Bid must be greater than current bid', 400);
      }

      const owner = await prisma.owner.findFirst({
        where: { id: ownerId, eventId: event.id },
      });

      if (!owner) {
        throw new AppError('Owner not found in this event', 404);
      }

      const team = await prisma.team.findFirst({
        where: { eventId: event.id, ownerId: owner.id },
      });

      if (!team) {
        throw new AppError('Owner has no team in this event', 400);
      }

      if (team.coinsLeft < amount) {
        throw new AppError('Insufficient coins for this bid', 400);
      }

      runtime.liveBids[lot.id] = {
        ownerId: owner.id,
        amount,
        updatedAt: Date.now(),
      };

      await this.saveRuntimeState(event.id, runtime);

      const liveOwnerName = owner.name;

      return {
        lot: toBoardLot(lot, runtime.liveBids[lot.id], liveOwnerName),
        eventId: event.id,
        timeLeft: computeTimeLeft(runtime.activeLotEndsAt),
      };
    });
  },

  async setLotStatus(eventIdOrSlug: string, lotId: string, status: 'SOLD' | 'UNSOLD' | 'ACTIVE') {
    const event = await eventService.getEvent(eventIdOrSlug);

    return withLock(event.id, async () => {
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      const lot = await prisma.auctionLot.findFirst({
        where: { id: lotId, eventId: event.id },
        include: { player: true, currentOwner: true },
      });

      if (!lot) {
        throw new AppError('Auction lot not found', 404);
      }

      if (status === 'ACTIVE') {
        await prisma.$transaction([
          prisma.auctionLot.update({
            where: { id: lot.id },
            data: {
              status: AuctionStatus.ACTIVE,
              timeLeft: event.auctionWindowSeconds,
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
        runtime.isRunning = true;
        runtime.activeLotEndsAt = Date.now() + (event.auctionWindowSeconds * 1000);
        runtime.timeLeft = computeTimeLeft(runtime.activeLotEndsAt);
        await this.saveRuntimeState(event.id, runtime);

        const refreshed = await prisma.auctionLot.findFirst({
          where: { id: lot.id, eventId: event.id },
          include: { player: true, currentOwner: true },
        });

        if (!refreshed) {
          throw new AppError('Auction lot not found after activation', 404);
        }

        return {
          lot: toBoardLot(refreshed),
          eventId: event.id,
        };
      }

      const settled = await this.settleLot(event, lot.id, runtime, {
        forcedStatus: status,
      });

      if (runtime.activeLotId === lot.id) {
        runtime.activeLotId = null;
        runtime.activeLotEndsAt = null;
        runtime.timeLeft = 0;
        runtime.isRunning = false;
      }

      await this.saveRuntimeState(event.id, runtime);

      return {
        lot: settled.lot,
        eventId: event.id,
      };
    });
  },

  async finalizePurchase(eventIdOrSlug: string, lotId: string, ownerId: string, amount: number) {
    const event = await eventService.getEvent(eventIdOrSlug);
    return withLock(event.id, async () => {
      const lot = await prisma.auctionLot.findFirst({
        where: { id: lotId, eventId: event.id },
      });

      if (!lot) {
        throw new AppError('Auction lot not found', 404);
      }

      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      const settled = await this.settleLot(event, lot.id, runtime, {
        forcedStatus: AuctionStatus.SOLD,
        overrideOwnerId: ownerId,
        overrideAmount: amount,
      });

      if (runtime.activeLotId === lot.id) {
        runtime.isRunning = false;
        runtime.activeLotId = null;
        runtime.activeLotEndsAt = null;
        runtime.timeLeft = 0;
      }

      await this.saveRuntimeState(event.id, runtime);

      return {
        eventId: event.id,
        lot: settled.lot,
        player: settled.player,
      };
    });
  },

  async startAuction(eventId: string, autoProgress = false) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);
      const firstPendingLot = await prisma.auctionLot.findFirst({
        where: {
          eventId: event.id,
          status: AuctionStatus.PENDING,
        },
        orderBy: { lotOrder: 'asc' },
      });

      const activeLot = await prisma.auctionLot.findFirst({
        where: {
          eventId: event.id,
          status: AuctionStatus.ACTIVE,
        },
        orderBy: { lotOrder: 'asc' },
      });

      const lotToActivate = activeLot || firstPendingLot;
      if (!lotToActivate) {
        throw new AppError('No lot available to start auction', 400);
      }

      if (lotToActivate.status !== AuctionStatus.ACTIVE) {
        await prisma.auctionLot.update({
          where: { id: lotToActivate.id },
          data: {
            status: AuctionStatus.ACTIVE,
            timeLeft: event.auctionWindowSeconds,
          },
        });
      }

      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      runtime.activeLotId = lotToActivate.id;
      runtime.isRunning = true;
      runtime.autoProgress = autoProgress;
      runtime.lotDuration = event.auctionWindowSeconds;
      delete runtime.liveBids[lotToActivate.id];
      runtime.activeLotEndsAt = Date.now() + (event.auctionWindowSeconds * 1000);
      runtime.timeLeft = event.auctionWindowSeconds;
      runtime.lastUpdatedAt = Date.now();
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
      runtime.timeLeft = 0;
      await this.saveRuntimeState(event.id, runtime);
      return runtime;
    });
  },

  async _progressToNextLot(event: { id: string; auctionWindowSeconds: number }, runtime: AuctionRuntimeState) {
    const currentLotId = runtime.activeLotId;
    if (!currentLotId) {
      throw new AppError('No active lot to progress from', 400);
    }

    const current = await prisma.auctionLot.findFirst({
      where: { id: currentLotId, eventId: event.id },
    });

    if (!current) {
      throw new AppError('Current active lot not found', 404);
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
      runtime.timeLeft = 0;
      await this.saveRuntimeState(event.id, runtime);
      await prisma.event.update({ where: { id: event.id }, data: { status: 'COMPLETED' } });
      return { done: true, runtime };
    }

    await prisma.auctionLot.update({
      where: { id: next.id },
      data: { status: AuctionStatus.ACTIVE, timeLeft: event.auctionWindowSeconds },
    });

    delete runtime.liveBids[next.id];
    runtime.activeLotId = next.id;
    runtime.activeLotEndsAt = Date.now() + (event.auctionWindowSeconds * 1000);
    runtime.timeLeft = event.auctionWindowSeconds;
    runtime.isRunning = true;
    await this.saveRuntimeState(event.id, runtime);

    return { done: false, runtime, nextLotId: next.id };
  },

  async nextLot(eventId: string) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      return this._progressToNextLot(event, runtime);
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
        throw new AppError('Auction lot not found', 404);
      }

      if (status === 'ACTIVE') {
        await prisma.auctionLot.updateMany({
          where: {
            eventId: event.id,
            status: AuctionStatus.ACTIVE,
            id: { not: lot.id },
          },
          data: { status: AuctionStatus.PENDING, timeLeft: 0 },
        });
      }

      let lotResponse: any;

      if (status === 'ACTIVE') {
        const updated = await prisma.auctionLot.update({
          where: { id: lot.id },
          data: {
            status: AuctionStatus.ACTIVE,
            timeLeft: event.auctionWindowSeconds,
          },
          include: {
            player: true,
            currentOwner: true,
          },
        });

        delete runtime.liveBids[lot.id];
        runtime.activeLotId = lot.id;
        runtime.isRunning = true;
        runtime.activeLotEndsAt = Date.now() + (event.auctionWindowSeconds * 1000);
        runtime.timeLeft = computeTimeLeft(runtime.activeLotEndsAt);
        lotResponse = toBoardLot(updated);
      } else {
        const settled = await this.settleLot(event, lot.id, runtime, {
          forcedStatus: status,
        });

        if (runtime.activeLotId === lot.id) {
          runtime.activeLotId = null;
          runtime.activeLotEndsAt = null;
          runtime.timeLeft = 0;
          runtime.isRunning = false;
        }

        lotResponse = settled.lot;
      }

      await this.saveRuntimeState(event.id, runtime);

      return {
        runtime,
        lot: lotResponse,
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
      const nextTimeLeft = computeTimeLeft(runtime.activeLotEndsAt);
      runtime.timeLeft = nextTimeLeft;

      await prisma.auctionLot.updateMany({
        where: { id: runtime.activeLotId, eventId: event.id },
        data: { timeLeft: nextTimeLeft },
      });

      await this.saveRuntimeState(event.id, runtime);

      if (nextTimeLeft === 0) {
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
          runtime.timeLeft = 0;
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
        const nextActiveLotId = progression.done ? null : (progression.nextLotId || null);
        return {
          runtime: refreshedRuntime,
          progressed: true,
          previousActiveLotId,
          nextActiveLotId,
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
