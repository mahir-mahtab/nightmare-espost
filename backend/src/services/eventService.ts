import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { EventStatus, PlayerStatus, AuctionStatus } from '@prisma/client';

export const eventService = {
  // Create event
  async createEvent(data: any) {
    const existingEvent = await prisma.event.findUnique({
      where: { slug: data.slug },
    });

    if (existingEvent) {
      throw new AppError('Event with this slug already exists', 400);
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

  // Helper: Get event by ID or slug
  async getEvent(idOrSlug: string) {
    // Check if it's a UUID (ID) or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    const event = await prisma.event.findUnique({
      where: isUUID ? { id: idOrSlug } : { slug: idOrSlug },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return event;
  },

  // Get event by ID
  async getEventById(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
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
            player: true,
            currentOwner: true,
          },
          orderBy: { lotOrder: 'asc' },
        },
      },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return event;
  },

  // Get event by slug
  async getEventBySlug(slug: string) {
    const event = await prisma.event.findUnique({
      where: { slug },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
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
            currentBid: player.basePrice,
            status: AuctionStatus.PENDING,
            lotOrder: index + 1,
            timeLeft: 30,
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
      ...event,
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
      throw new AppError('Team not found', 404);
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
      include: {
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
      throw new AppError('Owner not found', 404);
    }

    return owner;
  },

  async updateOwner(eventId: string, ownerId: string, data: any) {
    await this.getOwnerById(eventId, ownerId);

    return await prisma.owner.update({
      where: { id: ownerId },
      data,
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
      throw new AppError('Player not found', 404);
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
    await this.getPlayerById(eventId, playerId);

    return await prisma.player.delete({
      where: { id: playerId },
    });
  },

  // Get auction board
  async getAuctionBoard(eventIdOrSlug: string) {
    const event = await this.getEvent(eventIdOrSlug);
    
    const lots = await prisma.auctionLot.findMany({
      where: { eventId: event.id },
      include: {
        player: true,
        currentOwner: true,
      },
      orderBy: { lotOrder: 'asc' },
    });

    const activeLot = lots.find((lot: any) => lot.status === AuctionStatus.ACTIVE);

    return {
      activeAuctionId: activeLot?.id || null,
      lotDuration: event.auctionWindowSeconds,
      lots: lots.map((lot: any) => ({
        id: lot.id,
        playerId: lot.playerId,
        playerName: lot.player.name,
        currentBid: lot.currentBid,
        currentOwnerId: lot.currentOwnerId,
        currentOwnerName: lot.currentOwner?.name,
        status: lot.status,
        timeLeft: lot.timeLeft,
        lotOrder: lot.lotOrder,
      })),
    };
  },

  async createAuctionLot(eventId: string, data: any) {
    await this.getEventById(eventId);
    await this.getPlayerById(eventId, data.playerId);

    if (data.currentOwnerId) {
      await this.getOwnerById(eventId, data.currentOwnerId);
    }

    const existingOrder = await prisma.auctionLot.findFirst({
      where: { eventId, lotOrder: data.lotOrder },
    });

    if (existingOrder) {
      throw new AppError('Lot order already exists for this event', 400);
    }

    return await prisma.auctionLot.create({
      data: {
        eventId,
        playerId: data.playerId,
        currentBid: data.currentBid,
        currentOwnerId: data.currentOwnerId,
        status: data.status,
        timeLeft: data.timeLeft,
        lotOrder: data.lotOrder,
      },
    });
  },

  async getAuctionLotById(eventId: string, lotId: string) {
    const lot = await prisma.auctionLot.findFirst({
      where: { id: lotId, eventId },
    });

    if (!lot) {
      throw new AppError('Auction lot not found', 404);
    }

    return lot;
  },

  async updateAuctionLot(eventId: string, lotId: string, data: any) {
    await this.getAuctionLotById(eventId, lotId);

    if (data.playerId) {
      await this.getPlayerById(eventId, data.playerId);
    }

    if (data.currentOwnerId) {
      await this.getOwnerById(eventId, data.currentOwnerId);
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
        throw new AppError('Lot order already exists for this event', 400);
      }
    }

    return await prisma.auctionLot.update({
      where: { id: lotId },
      data,
    });
  },

  async deleteAuctionLot(eventId: string, lotId: string) {
    await this.getAuctionLotById(eventId, lotId);

    return await prisma.auctionLot.delete({
      where: { id: lotId },
    });
  },
};
