import { z } from 'zod';

const personNameRegex = /^[A-Za-z][A-Za-z\s.'-]{1,99}$/;
const teamNameRegex = /^[A-Za-z0-9][A-Za-z0-9\s&.'-]{1,99}$/;
const playerRoleRegex = /^[A-Za-z][A-Za-z0-9\s/-]{0,39}$/;

// Event validation schemas
export const createEventSchema = z.object({
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(255),
  season: z.string().optional(),
  game: z.string().min(2).max(100),
  mode: z.string().optional(),
  password: z.string().min(4).max(50),
  registrationCount: z.number().int().min(0).default(0),
  maxSlots: z.number().int().min(0).default(0),
  streamStartTime: z.string().optional(),
  auctionWindowSeconds: z.number().int().min(10).max(300).default(30),
  bannerUrl: z.string().url().optional(),
});

export const updateEventSchema = createEventSchema.partial();

// Team validation schemas
export const createTeamSchema = z.object({
  name: z.string().min(2).max(255),
  ownerId: z.string().uuid(),
  coinsLeft: z.number().int().min(0).default(0),
});

export const updateTeamSchema = createTeamSchema.partial();

// Owner validation schemas
export const createOwnerSchema = z.object({
  name: z.string().min(2).max(255),
  password: z.string().min(4).max(100),
  avatarUrl: z.string().url().optional(),
});

export const updateOwnerSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  password: z.string().min(4).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

// Player validation schemas
export const createPlayerSchema = z.object({
  name: z.string().min(2).max(255),
  role: z.string().min(1).max(50),
  rankPoint: z.number().int().min(0).max(100).default(0),
  basePrice: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
});

export const updatePlayerSchema = createPlayerSchema.partial().extend({
  status: z.enum(['ACTIVE', 'SOLD', 'UNSOLD']).optional(),
  soldToTeamId: z.string().uuid().nullable().optional(),
  finalPrice: z.number().int().min(0).nullable().optional(),
});

export const createAuctionLotSchema = z.object({
  playerId: z.string().uuid(),
  status: z.enum(['PENDING', 'ACTIVE', 'SOLD', 'UNSOLD']).default('PENDING'),
  endsAt: z.string().optional().refine((value) => {
    if (!value) {
      return true;
    }

    return !Number.isNaN(Date.parse(value));
  }, 'Invalid endsAt datetime'),
  lotOrder: z.number().int().min(1),
});

export const updateAuctionLotSchema = createAuctionLotSchema.partial();

// Bulk upload schemas
export const bulkTeamsSchema = z.array(createTeamSchema);
export const bulkOwnersSchema = z.array(createOwnerSchema);
export const bulkPlayersSchema = z.array(createPlayerSchema);

// Auth schemas
export const adminLoginSchema = z.object({
  password: z.string().min(6),
});

export const eventLoginSchema = z.object({
  password: z.string().min(4),
  role: z.enum(['owner', 'guest']),
  ownerId: z.string().uuid().optional(),
  ownerPassword: z.string().min(4).max(100).optional(),
});

export const ownerSignupSchema = z.object({
  eventPassword: z.string().min(4).max(50),
  ownerName: z.string().trim().min(2).max(100).regex(personNameRegex, 'Owner name format is invalid'),
  ownerPassword: z.string().trim().min(6).max(100),
  avatarUrl: z.string().trim().url().optional(),
  teamName: z.string().trim().min(2).max(100).regex(teamNameRegex, 'Team name format is invalid'),
  coinsLeft: z.number().int().min(0).max(100000).default(0),
});

export const playerSignupSchema = z.object({
  eventPassword: z.string().min(4).max(50),
  playerName: z.string().trim().min(2).max(100).regex(personNameRegex, 'Player name format is invalid'),
  playerRole: z.string().trim().min(2).max(40).regex(playerRoleRegex, 'Player role format is invalid'),
  rankPoint: z.number().int().min(0).max(100).default(0),
  basePrice: z.number().int().min(0).max(100000).default(0),
  imageUrl: z.string().trim().url().optional(),
});

// Auction schemas
export const placeBidSchema = z.object({
  lotId: z.string().uuid(),
  amount: z.number().int().min(1),
  ownerId: z.string().uuid().optional(),
});

export const updateLotStatusSchema = z.object({
  status: z.enum(['sold', 'unsold', 'active']),
});

export const auctionStartSchema = z.object({
  autoProgress: z.boolean().optional(),
});

export const manualLotOverrideSchema = z.object({
  lotId: z.string().uuid(),
  status: z.enum(['ACTIVE', 'SOLD', 'UNSOLD']),
});

export const extendTimerSchema = z.object({
  seconds: z.number().int().min(1).max(300),
});
