// ============================================================================
// Type Definitions for Nightmare Esports Backend
// ============================================================================

// ============================================================================
// Admin User Types
// ============================================================================

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  email: string | null;
  role: 'super_admin' | 'admin' | 'moderator';
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUserResponse {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUserResponse;
}

// ============================================================================
// Organization Settings Types
// ============================================================================

export interface OrgSettings {
  id: string;
  name: string;
  location: string;
  focus: string;
  services: string[];
  expansion: string | null;
  partnerships: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  discord_url: string | null;
  website_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Organization Roster Types
// ============================================================================

export interface OrgRoster {
  id: string;
  name: string;
  role: string | null;
  status: 'active' | 'inactive' | 'disbanded';
  game: string;
  logo_url: string | null;
  description: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrgRosterRequest {
  name: string;
  role?: string;
  status?: 'active' | 'inactive' | 'disbanded';
  game: string;
  logo_url?: string;
  description?: string;
  sort_order?: number;
}

// ============================================================================
// Achievement Types
// ============================================================================

export interface Achievement {
  id: string;
  rank: string;
  placement: string;
  team: string;
  tag: string | null;
  event: string;
  event_date: Date;
  color: 'gold' | 'silver' | 'bronze' | 'copper' | 'steel' | 'primary';
  image_url: string | null;
  description: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAchievementRequest {
  rank: string;
  placement: string;
  team: string;
  tag?: string;
  event: string;
  event_date: string;
  color?: 'gold' | 'silver' | 'bronze' | 'copper' | 'steel' | 'primary';
  image_url?: string;
  description?: string;
  sort_order?: number;
}

// ============================================================================
// Content Creator Types
// ============================================================================

export interface ContentCreator {
  id: string;
  name: string;
  role: 'Streamer' | 'Content Creator' | 'Pro Player' | 'Entertainer' | 'Analyst' | 'Coach';
  image_url: string | null;
  bio: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateContentCreatorRequest {
  name: string;
  role: 'Streamer' | 'Content Creator' | 'Pro Player' | 'Entertainer' | 'Analyst' | 'Coach';
  image_url?: string;
  bio?: string;
  youtube_url?: string;
  twitch_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

// ============================================================================
// Event Types
// ============================================================================

export interface Event {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  game: string;
  mode: string | null;
  start_date: Date;
  end_date: Date;
  registration_deadline: Date | null;
  location: string | null;
  stream_start_time: string | null;
  stream_url: string | null;
  banner_url: string | null;
  max_teams: number;
  max_players_per_team: number;
  registration_slots: number;
  purse_per_team: number;
  auction_duration: number;
  is_published: boolean;
  status: 'draft' | 'published' | 'registration' | 'ongoing' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  season?: string;
  game?: string;
  mode?: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  location?: string;
  stream_start_time?: string;
  stream_url?: string;
  banner_url?: string;
  max_teams?: number;
  max_players_per_team?: number;
  registration_slots?: number;
  purse_per_team?: number;
  auction_duration?: number;
  is_published?: boolean;
  status?: 'draft' | 'published' | 'registration' | 'ongoing' | 'completed' | 'cancelled';
}

export interface EventWithStats extends Event {
  team_count: number;
  player_count: number;
  sold_player_count: number;
  available_player_count: number;
  total_sold_value: number;
  avg_sold_price: number | null;
}

// ============================================================================
// Event Prize Structure Types
// ============================================================================

export interface EventPrizeStructure {
  id: string;
  event_id: string;
  rank: string;
  rewards: string;
  prize_amount: number;
  sort_order: number;
  created_at: Date;
}

// ============================================================================
// Event Invited Teams Types
// ============================================================================

export interface EventInvitedTeam {
  id: string;
  event_id: string;
  team_name: string;
  is_confirmed: boolean;
  sort_order: number;
  created_at: Date;
}

// ============================================================================
// Event Partners Types
// ============================================================================

export interface EventPartner {
  id: string;
  event_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  partner_type: 'sponsor' | 'partner' | 'media';
  sort_order: number;
  created_at: Date;
}

// ============================================================================
// Team Types (Auction Teams)
// ============================================================================

export interface Team {
  id: string;
  event_id: string;
  name: string;
  owner_name: string;
  owner_email: string | null;
  owner_phone: string | null;
  owner_avatar_url: string | null;
  owner_password_hash: string | null;
  purse: number;
  coins_left: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TeamResponse {
  id: string;
  event_id: string;
  name: string;
  owner_name: string;
  owner_email: string | null;
  owner_avatar_url: string | null;
  purse: number;
  coins_left: number;
  is_active: boolean;
  player_count?: number;
  players?: PlayerResponse[];
}

export interface CreateTeamRequest {
  name: string;
  owner_name: string;
  owner_email?: string;
  owner_phone?: string;
  owner_avatar_url?: string;
  owner_password?: string;
  purse?: number;
}

// ============================================================================
// Player Types
// ============================================================================

export interface Player {
  id: string;
  event_id: string;
  name: string;
  role: string | null;
  original_team_name: string | null;
  base_price: number;
  team_id: string | null;
  sold_price: number | null;
  rank_point: number;
  nm_coin: number;
  stats: Record<string, unknown>;
  image_url: string | null;
  status: 'available' | 'sold' | 'unsold' | 'withdrawn';
  created_at: Date;
  updated_at: Date;
}

export interface PlayerResponse extends Omit<Player, 'created_at' | 'updated_at'> {
  team_name?: string;
}

export interface CreatePlayerRequest {
  name: string;
  role?: string;
  original_team_name?: string;
  base_price?: number;
  rank_point?: number;
  nm_coin?: number;
  stats?: Record<string, unknown>;
  image_url?: string;
  status?: 'available' | 'sold' | 'unsold' | 'withdrawn';
}

// ============================================================================
// Auction Types
// ============================================================================

export interface AuctionState {
  id: string;
  event_id: string;
  is_active: boolean;
  current_player_id: string | null;
  current_bid: number | null;
  current_bidder_id: string | null;
  start_time: Date | null;
  duration: number;
  bid_increments: number[];
  created_at: Date;
  updated_at: Date;
}

export interface AuctionStateResponse {
  is_active: boolean;
  current_player: PlayerResponse | null;
  current_bid: number | null;
  current_bidder: TeamResponse | null;
  start_time: string | null;
  duration: number;
  bid_increments: number[];
  time_remaining?: number;
}

export interface Bid {
  id: string;
  event_id: string;
  player_id: string;
  team_id: string;
  amount: number;
  created_at: Date;
}

export interface PlaceBidRequest {
  team_id: string;
  amount: number;
}

export interface AuctionLot {
  id: string;
  event_id: string;
  player_id: string;
  final_bid: number | null;
  winning_team_id: string | null;
  status: 'pending' | 'active' | 'sold' | 'unsold';
  started_at: Date | null;
  ended_at: Date | null;
  lot_number: number;
}

// ============================================================================
// Dashboard Stats Types
// ============================================================================

export interface DashboardStats {
  total_events: number;
  active_events: number;
  total_players: number;
  total_teams: number;
  total_creators: number;
  total_achievements: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PlayerQueryParams extends PaginationParams {
  search?: string;
  role?: string;
  status?: string;
  team_id?: string;
}

export interface EventQueryParams extends PaginationParams {
  status?: string;
  is_published?: boolean;
  game?: string;
}
