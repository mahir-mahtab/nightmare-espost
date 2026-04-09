import { z } from 'zod';

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
  avatarUrl: z.string().url().optional(),
});

export const updateOwnerSchema = createOwnerSchema.partial();

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
  currentBid: z.number().int().min(0).default(0),
  currentOwnerId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SOLD', 'UNSOLD']).default('PENDING'),
  timeLeft: z.number().int().min(0).default(30),
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
  displayName: z.string().min(2).max(100),
  role: z.enum(['owner', 'viewer']),
  ownerId: z.string().uuid().optional(),
});

// Auction schemas
export const placeBidSchema = z.object({
  lotId: z.string().uuid(),
  ownerId: z.string().uuid(),
  amount: z.number().int().min(1),
});

export const updateLotStatusSchema = z.object({
  status: z.enum(['sold', 'unsold', 'active']),
});
