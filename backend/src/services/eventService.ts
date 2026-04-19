import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { EventStatus, PlayerStatus, AuctionStatus } from '@prisma/client';

const runtimeRedisKey = (eventId: string) => `auction:${eventId}:state`;

export const eventService = {
  // Create event
  async createEvent(data: any) {
    const existingEvent = await prisma.event.findUnique({
      where: { slug: data.slug },
    });

    if (existingEvent) {
      throw new AppError('Event slug already exists. Please use a different slug.', 409, 'EVENT_SLUG_CONFLICT');
    }

    return await prisma.event.create({
      data: {
        ...data,
        status: EventStatus.UPCOMING,
      },
    });
  },

  // List all events
  async listEvents(status?: EventStatus) {
    return await prisma.event.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            teams: true,
            players: true,
            owners: true,
            auctionLots: true,
          },
        },
      },
    });
  },

  async listPublicEvents() {
    return await prisma.event.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        season: true,
        game: true,
        mode: true,
        registrationCount: true,
        maxSlots: true,
        streamStartTime: true,
        bannerUrl: true,
        sponsorImageUrl: true,
        status: true,
      },
      where: {
        status: { in: [EventStatus.UPCOMING, EventStatus.LIVE] },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Helper: Get event by ID or slug
  async getEvent(idOrSlug: string) {
    // Check if it's a UUID (ID) or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    const event = await prisma.event.findUnique({
      where: isUUID ? { id: idOrSlug } : { slug: idOrSlug },
    });

    if (!event) {
      throw new AppError('Event not found for the provided ID or slug.', 404, 'EVENT_NOT_FOUND');
    }

    return event;
  },

  // Get event by ID
  async getEventById(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError('Event not found for the provided ID.', 404, 'EVENT_NOT_FOUND');
    }

    return event;
  },

  // Get full event data for admin workspace
  async getEventFullForAdmin(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            teams: true,
            players: true,
            owners: true,
            auctionLots: true,
          },
        },
        owners: {
          select: {
            id: true,
            eventId: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        teams: {
          include: {
            owner: true,
            players: {
              where: { status: PlayerStatus.SOLD },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        players: {
          include: {
            soldToTeam: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        auctionLots: {
          include: {
            player: {
              include: {
                soldToTeam: {
                  include: {
                    owner: true,
                  },
                },
              },
            },
          },
          orderBy: { lotOrder: 'asc' },
        },
      },
    });

    if (!event) {
      throw new AppError('Event not found for admin workspace.', 404, 'EVENT_NOT_FOUND');
    }

    let runtimeState: any = null;
    try {
      const rawState = await redis.get(runtimeRedisKey(event.id));
      if (rawState) {
        runtimeState = JSON.parse(rawState);
      }
    } catch {
      runtimeState = null;
    }

    const liveBids = runtimeState?.liveBids && typeof runtimeState.liveBids === 'object'
      ? runtimeState.liveBids
      : {};

    const liveOwnerIds = Object.values(liveBids)
      .map((bid: any) => bid?.ownerId)
      .filter((ownerId: any) => typeof ownerId === 'string');

    const liveOwners = liveOwnerIds.length
      ? await prisma.owner.findMany({
        where: { eventId: event.id, id: { in: liveOwnerIds as string[] } },
        select: { id: true, name: true },
      })
      : [];

    const ownerNameById = Object.fromEntries(liveOwners.map((owner) => [owner.id, owner.name]));

    const activeLotEndsAt = runtimeState?.activeLotEndsAt ? Number(runtimeState.activeLotEndsAt) : null;
    const now = Date.now();

    const auctionLots = (event.auctionLots || []).map((lot: any) => {
      const liveBid = liveBids[lot.id];
      const soldOwnerName = lot.player?.soldToTeam?.owner?.name || null;
      const soldOwnerId = lot.player?.soldToTeam?.ownerId || null;

      const liveCurrentBid = typeof liveBid?.amount === 'number' ? liveBid.amount : null;
      const liveCurrentOwnerId = typeof liveBid?.ownerId === 'string' ? liveBid.ownerId : null;
      const liveCurrentOwnerName = liveCurrentOwnerId ? ownerNameById[liveCurrentOwnerId] || null : null;

      const computedBid = lot.status === AuctionStatus.SOLD
        ? (lot.player?.finalPrice ?? lot.player?.basePrice ?? 0)
        : (liveCurrentBid ?? lot.player?.basePrice ?? 0);

      const computedOwnerId = lot.status === AuctionStatus.SOLD
        ? soldOwnerId
        : liveCurrentOwnerId;

      const computedOwnerName = lot.status === AuctionStatus.SOLD
        ? soldOwnerName
        : liveCurrentOwnerName;

      const effectiveEndsAt = runtimeState?.activeLotId === lot.id && activeLotEndsAt
        ? new Date(activeLotEndsAt).toISOString()
        : lot.endsAt;

      const computedTimeLeft = effectiveEndsAt
        ? Math.max(0, Math.ceil((new Date(effectiveEndsAt).getTime() - now) / 1000))
        : 0;

      return {
        ...lot,
        currentBid: computedBid,
        currentOwnerId: computedOwnerId,
        currentOwnerName: computedOwnerName,
        timeLeft: computedTimeLeft,
        endsAt: effectiveEndsAt,
      };
    });

    return {
      ...event,
      auctionRuntime: {
        isRunning: Boolean(runtimeState?.isRunning),
        autoProgress: Boolean(runtimeState?.autoProgress),
        activeLotId: runtimeState?.activeLotId || null,
        activeLotEndsAt: activeLotEndsAt ? new Date(activeLotEndsAt).toISOString() : null,
      },
      auctionLots,
    };
  },

  // Get event by slug
  async getEventBySlug(slug: string) {
    const event = await prisma.event.findUnique({
      where: { slug },
    });

    if (!event) {
      throw new AppError('Event not found for the provided slug.', 404, 'EVENT_NOT_FOUND');
    }

    return event;
  },

  // Update event
  async updateEvent(eventId: string, data: any) {
    await this.getEventById(eventId);

    return await prisma.event.update({
      where: { id: eventId },
      data,
    });
  },

  // Delete event
  async deleteEvent(eventId: string) {
    await this.getEventById(eventId);
    
    return await prisma.event.delete({
      where: { id: eventId },
    });
  },

  // Verify event password
  async verifyEventPassword(eventIdOrSlug: string, password: string): Promise<boolean> {
    const event = await this.getEvent(eventIdOrSlug);
    return event.password === password;
  },

  // Create teams
  async createTeams(eventId: string, teams: any[]) {
    await this.getEventById(eventId);

    return await prisma.$transaction(
      teams.map((team) =>
        prisma.team.create({
          data: {
            ...team,
            eventId,
          },
        })
      )
    );
  },

  // Create owners
  async createOwners(eventId: string, owners: any[]) {
    await this.getEventById(eventId);

    return await prisma.$transaction(
      owners.map((owner) =>
        prisma.owner.create({
          data: {
            ...owner,
            eventId,
          },
          select: {
            id: true,
            eventId: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        })
      )
    );
  },

  // Create players and auction lots
  async createPlayers(eventId: string, players: any[]) {
    await this.getEventById(eventId);

    // Create players and corresponding auction lots
    const createdPlayers = await prisma.$transaction(
      players.map((player) =>
        prisma.player.create({
          data: {
            ...player,
            eventId,
            status: PlayerStatus.ACTIVE,
          },
        })
      )
    );

    // Create auction lots for all players
    const auctionLots = await prisma.$transaction(
      createdPlayers.map((player: any, index: number) =>
        prisma.auctionLot.create({
          data: {
            eventId,
            playerId: player.id,
            status: AuctionStatus.PENDING,
            lotOrder: index + 1,
            endsAt: null,
          },
        })
      )
    );

    return { players: createdPlayers, auctionLots };
  },

  // Get event summary
  async getEventSummary(eventIdOrSlug: string) {
    const event = await this.getEvent(eventIdOrSlug);
    
    // Get counts
    const [teamsCount, playersCount, ownersCount] = await Promise.all([
      prisma.team.count({ where: { eventId: event.id } }),
      prisma.player.count({ where: { eventId: event.id } }),
      prisma.owner.count({ where: { eventId: event.id } }),
    ]);

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      season: event.season,
      game: event.game,
      mode: event.mode,
      registrationCount: event.registrationCount,
      maxSlots: event.maxSlots,
      streamStartTime: event.streamStartTime,
      auctionWindowSeconds: event.auctionWindowSeconds,
      bannerUrl: event.bannerUrl,
      sponsorImageUrl: event.sponsorImageUrl,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      totalTeams: teamsCount,
      totalPlayers: playersCount,
      totalOwners: ownersCount,
    };
  },

  // Get teams
  async getTeams(eventIdOrSlug: string) {
    const event = await this.getEvent(eventIdOrSlug);
    return await prisma.team.findMany({
      where: { eventId: event.id },
      include: {
        owner: true,
        players: {
          where: { status: PlayerStatus.SOLD },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async getTeamById(eventId: string, teamId: string) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, eventId },
    });

    if (!team) {
      throw new AppError('Team not found in this event.', 404, 'TEAM_NOT_FOUND');
    }

    return team;
  },

  async updateTeam(eventId: string, teamId: string, data: any) {
    await this.getTeamById(eventId, teamId);

    return await prisma.team.update({
      where: { id: teamId },
      data,
    });
  },

  async deleteTeam(eventId: string, teamId: string) {
    await this.getTeamById(eventId, teamId);

    return await prisma.team.delete({
      where: { id: teamId },
    });
  },

  // Get owners
  async getOwners(eventIdOrSlug: string) {
    const event = await this.getEvent(eventIdOrSlug);
    return await prisma.owner.findMany({
      where: { eventId: event.id },
      select: {
        id: true,
        eventId: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { teams: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async getOwnerById(eventId: string, ownerId: string) {
    const owner = await prisma.owner.findFirst({
      where: { id: ownerId, eventId },
    });

    if (!owner) {
      throw new AppError('Owner not found in this event.', 404, 'OWNER_NOT_FOUND');
    }

    return owner;
  },

  async updateOwner(eventId: string, ownerId: string, data: any) {
    await this.getOwnerById(eventId, ownerId);

    return await prisma.owner.update({
      where: { id: ownerId },
      data,
      select: {
        id: true,
        eventId: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  },

  async deleteOwner(eventId: string, ownerId: string) {
    await this.getOwnerById(eventId, ownerId);

    return await prisma.owner.delete({
      where: { id: ownerId },
    });
  },

  // Get players with filters
  async getPlayers(eventIdOrSlug: string, filters: {
    search?: string;
    role?: string;
    status?: PlayerStatus | string;
  } = {}) {
    const event = await this.getEvent(eventIdOrSlug);
    const where: any = { eventId: event.id };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.role && filters.role !== 'all') {
      where.role = filters.role;
    }

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    return await prisma.player.findMany({
      where,
      include: {
        soldToTeam: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async getPlayerById(eventId: string, playerId: string) {
    const player = await prisma.player.findFirst({
      where: { id: playerId, eventId },
    });

    if (!player) {
      throw new AppError('Player not found in this event.', 404, 'PLAYER_NOT_FOUND');
    }

    return player;
  },

  async updatePlayer(eventId: string, playerId: string, data: any) {
    await this.getPlayerById(eventId, playerId);

    return await prisma.player.update({
      where: { id: playerId },
      data,
    });
  },

  async deletePlayer(eventId: string, playerId: string) {
    const player = await this.getPlayerById(eventId, playerId);

    const playerLots = await prisma.auctionLot.findMany({
      where: {
        eventId,
        playerId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    const hasActiveLot = playerLots.some((lot) => lot.status === AuctionStatus.ACTIVE);
    if (hasActiveLot) {
      throw new AppError('Cannot delete a player while their auction lot is active. Settle or reset the lot first.', 400, 'PLAYER_ACTIVE_AUCTION_LOT');
    }

    const soldTeamId = player.soldToTeamId;
    const soldFinalPrice = player.finalPrice || 0;

    await prisma.$transaction(async (tx) => {
      if (player.status === PlayerStatus.SOLD && soldTeamId && soldFinalPrice > 0) {
        await tx.team.update({
          where: { id: soldTeamId },
          data: {
            coinsLeft: { increment: soldFinalPrice },
          },
        });
      }

      await tx.auctionLot.deleteMany({
        where: {
          eventId,
          playerId,
        },
      });

      await tx.player.delete({
        where: { id: playerId },
      });
    });

    if (playerLots.length > 0) {
      try {
        const rawState = await redis.get(runtimeRedisKey(eventId));
        if (rawState) {
          const runtimeState = JSON.parse(rawState);
          for (const lot of playerLots) {
            if (runtimeState?.liveBids && runtimeState.liveBids[lot.id]) {
              delete runtimeState.liveBids[lot.id];
            }
          }

          await redis.set(runtimeRedisKey(eventId), JSON.stringify(runtimeState));
        }
      } catch {
        // Best-effort cleanup of runtime cache.
      }
    }

    return {
      id: player.id,
      refunded: Boolean(player.status === PlayerStatus.SOLD && soldTeamId && soldFinalPrice > 0),
      refundedAmount: player.status === PlayerStatus.SOLD && soldTeamId ? soldFinalPrice : 0,
      deletedLotCount: playerLots.length,
    };
  },

  // Get auction board
  async getAuctionBoard(eventIdOrSlug: string) {
    const event = await this.getEvent(eventIdOrSlug);
    let runtimeState: any = null;

    try {
      const rawState = await redis.get(runtimeRedisKey(event.id));
      if (rawState) {
        runtimeState = JSON.parse(rawState);
      }
    } catch {
      runtimeState = null;
    }

    const activeLotEndsAt = runtimeState?.activeLotEndsAt ? Number(runtimeState.activeLotEndsAt) : null;
    
    const lots = await prisma.auctionLot.findMany({
      where: { eventId: event.id },
      include: {
        player: {
          include: {
            soldToTeam: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
      orderBy: { lotOrder: 'asc' },
    });

    const activeLot = lots.find((lot: any) => lot.status === AuctionStatus.ACTIVE);
    const now = Date.now();

    return {
      activeAuctionId: activeLot?.id || null,
      isRunning: Boolean(runtimeState?.isRunning),
      autoProgress: Boolean(runtimeState?.autoProgress),
      activeLotEndsAt: activeLotEndsAt ? new Date(activeLotEndsAt).toISOString() : null,
      lotDuration: event.auctionWindowSeconds,
      lots: lots.map((lot: any) => ({
        id: lot.id,
        playerId: lot.playerId,
        playerName: lot.player.name,
        currentBid: lot.status === AuctionStatus.SOLD
          ? (lot.player.finalPrice ?? lot.player.basePrice)
          : lot.player.basePrice,
        currentOwnerId: lot.status === AuctionStatus.SOLD
          ? (lot.player.soldToTeam?.ownerId || null)
          : null,
        currentOwnerName: lot.status === AuctionStatus.SOLD
          ? (lot.player.soldToTeam?.owner?.name || null)
          : null,
        status: lot.status,
        timeLeft: (runtimeState?.activeLotId === lot.id && activeLotEndsAt)
          ? Math.max(0, Math.ceil((activeLotEndsAt - now) / 1000))
          : lot.endsAt
          ? Math.max(0, Math.ceil((new Date(lot.endsAt).getTime() - now) / 1000))
          : 0,
        endsAt: (runtimeState?.activeLotId === lot.id && activeLotEndsAt)
          ? new Date(activeLotEndsAt).toISOString()
          : lot.endsAt,
        lotOrder: lot.lotOrder,
      })),
    };
  },

  async createAuctionLot(eventId: string, data: any) {
    await this.getEventById(eventId);
    await this.getPlayerById(eventId, data.playerId);

    const existingOrder = await prisma.auctionLot.findFirst({
      where: { eventId, lotOrder: data.lotOrder },
    });

    if (existingOrder) {
      throw new AppError('Lot order already exists in this event. Choose a different order number.', 409, 'LOT_ORDER_CONFLICT');
    }

    return await prisma.auctionLot.create({
      data: {
        eventId,
        playerId: data.playerId,
        status: data.status,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        lotOrder: data.lotOrder,
      },
    });
  },

  async getAuctionLotById(eventId: string, lotId: string) {
    const lot = await prisma.auctionLot.findFirst({
      where: { id: lotId, eventId },
    });

    if (!lot) {
      throw new AppError('Auction lot not found in this event.', 404, 'AUCTION_LOT_NOT_FOUND');
    }

    return lot;
  },

  async updateAuctionLot(eventId: string, lotId: string, data: any) {
    await this.getAuctionLotById(eventId, lotId);

    if (data.playerId) {
      await this.getPlayerById(eventId, data.playerId);
    }

    if (data.lotOrder) {
      const existingOrder = await prisma.auctionLot.findFirst({
        where: {
          eventId,
          lotOrder: data.lotOrder,
          id: { not: lotId },
        },
      });

      if (existingOrder) {
        throw new AppError('Lot order already exists in this event. Choose a different order number.', 409, 'LOT_ORDER_CONFLICT');
      }
    }

    return await prisma.auctionLot.update({
      where: { id: lotId },
      data: {
        ...data,
        endsAt: data.endsAt ? new Date(data.endsAt) : data.endsAt === null ? null : undefined,
      },
    });
  },

  async deleteAuctionLot(eventId: string, lotId: string) {
    await this.getAuctionLotById(eventId, lotId);

    return await prisma.auctionLot.delete({
      where: { id: lotId },
    });
  },
};
