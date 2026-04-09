import { AuctionStatus, PlayerStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { eventService } from './eventService.js';

const redisKey = {
  state: (eventId: string) => `auction:${eventId}:state`,
  lock: (eventId: string) => `auction:${eventId}:lock`,
};

const parseAuctionStatus = (status: string) => {
  switch (status) {
    case 'PENDING':
      return AuctionStatus.PENDING;
    case 'ACTIVE':
      return AuctionStatus.ACTIVE;
    case 'SOLD':
      return AuctionStatus.SOLD;
    case 'UNSOLD':
      return AuctionStatus.UNSOLD;
    default:
      throw new AppError('Invalid lot status', 400);
  }
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
});

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

const toBoardLot = (lot: any) => ({
  id: lot.id,
  playerId: lot.playerId,
  playerName: lot.player?.name,
  currentBid: lot.currentBid,
  currentOwnerId: lot.currentOwnerId,
  currentOwnerName: lot.currentOwner?.name,
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
      return JSON.parse(raw) as AuctionRuntimeState;
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

  async getAuctionState(eventIdOrSlug: string) {
    const event = await eventService.getEvent(eventIdOrSlug);
    const board = await eventService.getAuctionBoard(event.id);
    const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

    return {
      eventId: event.id,
      activeLotId: runtime.activeLotId,
      isRunning: runtime.isRunning,
      autoProgress: runtime.autoProgress,
      lotDuration: runtime.lotDuration,
      activeLotEndsAt: runtime.activeLotEndsAt,
      timeLeft: computeTimeLeft(runtime.activeLotEndsAt),
      lots: board.lots,
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

      if (amount <= lot.currentBid) {
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

      const updated = await prisma.auctionLot.update({
        where: { id: lot.id },
        data: {
          currentBid: amount,
          currentOwnerId: owner.id,
        },
        include: {
          player: true,
          currentOwner: true,
        },
      });

      await this.saveRuntimeState(event.id, runtime);

      return {
        lot: toBoardLot(updated),
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
        include: { player: true },
      });

      if (!lot) {
        throw new AppError('Auction lot not found', 404);
      }

      const auctionStatus = parseAuctionStatus(status);

      if (auctionStatus === AuctionStatus.SOLD && !lot.currentOwnerId) {
        throw new AppError('Cannot mark SOLD without a winning owner', 400);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedLot = await tx.auctionLot.update({
          where: { id: lot.id },
          data: {
            status: auctionStatus,
            timeLeft: auctionStatus === AuctionStatus.ACTIVE ? event.auctionWindowSeconds : 0,
          },
          include: {
            player: true,
            currentOwner: true,
          },
        });

        if (auctionStatus === AuctionStatus.SOLD) {
          const team = await tx.team.findFirst({
            where: {
              eventId: event.id,
              ownerId: lot.currentOwnerId || undefined,
            },
          });

          if (!team) {
            throw new AppError('Winning owner team not found', 400);
          }

          if (team.coinsLeft < lot.currentBid) {
            throw new AppError('Winning team has insufficient coins', 400);
          }

          await tx.team.update({
            where: { id: team.id },
            data: {
              coinsLeft: {
                decrement: lot.currentBid,
              },
            },
          });

          await tx.player.update({
            where: { id: lot.playerId },
            data: {
              status: PlayerStatus.SOLD,
              soldToTeamId: team.id,
              finalPrice: lot.currentBid,
            },
          });
        }

        if (auctionStatus === AuctionStatus.UNSOLD) {
          await tx.player.update({
            where: { id: lot.playerId },
            data: {
              status: PlayerStatus.UNSOLD,
              soldToTeamId: null,
              finalPrice: null,
            },
          });
        }

        if (auctionStatus === AuctionStatus.ACTIVE) {
          await tx.player.update({
            where: { id: lot.playerId },
            data: {
              status: PlayerStatus.ACTIVE,
            },
          });
        }

        return updatedLot;
      });

      runtime.activeLotId = auctionStatus === AuctionStatus.ACTIVE ? updated.id : runtime.activeLotId;
      runtime.activeLotEndsAt = auctionStatus === AuctionStatus.ACTIVE
        ? Date.now() + (event.auctionWindowSeconds * 1000)
        : (runtime.activeLotId === updated.id ? null : runtime.activeLotEndsAt);
      runtime.timeLeft = computeTimeLeft(runtime.activeLotEndsAt);
      await this.saveRuntimeState(event.id, runtime);

      return {
        lot: toBoardLot(updated),
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

      const team = await prisma.team.findFirst({
        where: { eventId: event.id, ownerId },
      });

      if (!team) {
        throw new AppError('Owner has no team in this event', 400);
      }

      if (team.coinsLeft < amount) {
        throw new AppError('Insufficient team coins', 400);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedLot = await tx.auctionLot.update({
          where: { id: lot.id },
          data: {
            currentBid: amount,
            currentOwnerId: ownerId,
            status: AuctionStatus.SOLD,
            timeLeft: 0,
          },
          include: {
            player: true,
            currentOwner: true,
          },
        });

        await tx.team.update({
          where: { id: team.id },
          data: {
            coinsLeft: {
              decrement: amount,
            },
          },
        });

        const player = await tx.player.update({
          where: { id: lot.playerId },
          data: {
            status: PlayerStatus.SOLD,
            soldToTeamId: team.id,
            finalPrice: amount,
          },
        });

        return { updatedLot, player };
      });

      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);
      if (runtime.activeLotId === lot.id) {
        runtime.isRunning = false;
        runtime.activeLotId = null;
        runtime.activeLotEndsAt = null;
        runtime.timeLeft = 0;
        await this.saveRuntimeState(event.id, runtime);
      }

      return {
        eventId: event.id,
        lot: toBoardLot(updated.updatedLot),
        player: updated.player,
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

      const runtime: AuctionRuntimeState = {
        eventId: event.id,
        activeLotId: lotToActivate.id,
        isRunning: true,
        autoProgress,
        lotDuration: event.auctionWindowSeconds,
        activeLotEndsAt: Date.now() + (event.auctionWindowSeconds * 1000),
        timeLeft: event.auctionWindowSeconds,
        lastUpdatedAt: Date.now(),
      };
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

  async nextLot(eventId: string) {
    return withLock(eventId, async () => {
      const event = await eventService.getEventById(eventId);
      const runtime = await this.getRuntimeState(event.id, event.auctionWindowSeconds);

      if (!runtime.activeLotId) {
        throw new AppError('No active lot to progress from', 400);
      }

      const current = await prisma.auctionLot.findFirst({
        where: { id: runtime.activeLotId, eventId: event.id },
      });

      if (!current) {
        throw new AppError('Current active lot not found', 404);
      }

      if (current.status === AuctionStatus.ACTIVE) {
        if (current.currentOwnerId) {
          const team = await prisma.team.findFirst({
            where: { eventId: event.id, ownerId: current.currentOwnerId },
          });

          if (!team) {
            throw new AppError('Winning owner team not found', 400);
          }

          if (team.coinsLeft < current.currentBid) {
            throw new AppError('Winning team has insufficient coins', 400);
          }

          await prisma.$transaction([
            prisma.auctionLot.update({
              where: { id: current.id },
              data: {
                status: AuctionStatus.SOLD,
                timeLeft: 0,
              },
            }),
            prisma.team.update({
              where: { id: team.id },
              data: { coinsLeft: { decrement: current.currentBid } },
            }),
            prisma.player.update({
              where: { id: current.playerId },
              data: {
                status: PlayerStatus.SOLD,
                soldToTeamId: team.id,
                finalPrice: current.currentBid,
              },
            }),
          ]);
        } else {
          await prisma.$transaction([
            prisma.auctionLot.update({
              where: { id: current.id },
              data: {
                status: AuctionStatus.UNSOLD,
                timeLeft: 0,
              },
            }),
            prisma.player.update({
              where: { id: current.playerId },
              data: {
                status: PlayerStatus.UNSOLD,
                soldToTeamId: null,
                finalPrice: null,
              },
            }),
          ]);
        }
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
        data: {
          status: AuctionStatus.ACTIVE,
          timeLeft: event.auctionWindowSeconds,
        },
      });

      runtime.activeLotId = next.id;
      runtime.activeLotEndsAt = Date.now() + (event.auctionWindowSeconds * 1000);
      runtime.timeLeft = event.auctionWindowSeconds;
      runtime.isRunning = true;
      await this.saveRuntimeState(event.id, runtime);

      return {
        done: false,
        runtime,
        nextLotId: next.id,
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

      const updated = await prisma.auctionLot.update({
        where: { id: lot.id },
        data: {
          status: parseAuctionStatus(status),
          timeLeft: status === 'ACTIVE' ? event.auctionWindowSeconds : 0,
        },
        include: {
          player: true,
          currentOwner: true,
        },
      });

      runtime.activeLotId = status === 'ACTIVE' ? lot.id : runtime.activeLotId;
      runtime.activeLotEndsAt = status === 'ACTIVE'
        ? Date.now() + (event.auctionWindowSeconds * 1000)
        : (runtime.activeLotId === lot.id ? null : runtime.activeLotEndsAt);
      runtime.timeLeft = computeTimeLeft(runtime.activeLotEndsAt);
      await this.saveRuntimeState(event.id, runtime);

      return {
        runtime,
        lot: toBoardLot(updated),
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
            if (current.currentOwnerId) {
              const team = await prisma.team.findFirst({
                where: { eventId: event.id, ownerId: current.currentOwnerId },
              });

              if (!team) {
                throw new AppError('Winning owner team not found', 400);
              }

              if (team.coinsLeft < current.currentBid) {
                throw new AppError('Winning team has insufficient coins', 400);
              }

              await prisma.$transaction([
                prisma.auctionLot.update({
                  where: { id: current.id },
                  data: { status: AuctionStatus.SOLD, timeLeft: 0 },
                }),
                prisma.team.update({
                  where: { id: team.id },
                  data: { coinsLeft: { decrement: current.currentBid } },
                }),
                prisma.player.update({
                  where: { id: current.playerId },
                  data: {
                    status: PlayerStatus.SOLD,
                    soldToTeamId: team.id,
                    finalPrice: current.currentBid,
                  },
                }),
              ]);
            } else {
              await prisma.$transaction([
                prisma.auctionLot.update({
                  where: { id: current.id },
                  data: { status: AuctionStatus.UNSOLD, timeLeft: 0 },
                }),
                prisma.player.update({
                  where: { id: current.playerId },
                  data: {
                    status: PlayerStatus.UNSOLD,
                    soldToTeamId: null,
                    finalPrice: null,
                  },
                }),
              ]);
            }
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

        const progression = await this.nextLot(event.id);
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
