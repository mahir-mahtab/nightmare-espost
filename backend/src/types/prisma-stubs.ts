/**
 * Prisma type stubs for compilation without database
 * These types will be replaced by actual Prisma Client types after `prisma generate`
 */

// Enums from schema
export enum EventStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  UPCOMING = 'UPCOMING'
}

export enum PlayerStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD',
  ACTIVE = 'ACTIVE'
}

export enum AuctionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD'
}

// Model types
export interface Event {
  id: string;
  name: string;
  description: string | null;
  eventDate: Date;
  password: string;
  status: EventStatus;
  bannerImage: string | null;
  pursePerTeam: number;
  totalTeams: number;
  bidIncrement: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  eventId: string;
  name: string;
  logo: string | null;
  ownerId: string | null;
  remainingPurse: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Owner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  eventId: string;
  name: string;
  photo: string | null;
  basePrice: number;
  status: PlayerStatus;
  soldPrice: number | null;
  teamId: string | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuctionLot {
  id: string;
  eventId: string;
  playerId: string;
  lotNumber: number;
  status: AuctionStatus;
  startTime: Date | null;
  endTime: Date | null;
  finalPrice: number | null;
  winningTeamId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionLog {
  id: string;
  eventId: string;
  lotId: string | null;
  action: string;
  metadata: any;
  createdAt: Date;
}

// Prisma Client stub
export interface PrismaClient {
  event: any;
  team: any;
  owner: any;
  player: any;
  auctionLot: any;
  actionLog: any;
  $disconnect: () => Promise<void>;
}
