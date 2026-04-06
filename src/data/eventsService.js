/**
 * Events Service - Mock Implementation
 * 
 * TODO: Replace mock implementations with real API calls
 * 
 * API Endpoint Mapping:
 * =====================
 * 
 * PUBLIC ENDPOINTS (no auth required):
 * - getEventSummary()     -> GET /api/public/events/:eventId
 * - getBidIncrements()    -> Static config or GET /api/public/events/:eventId (includes increments)
 * 
 * AUTHENTICATED ENDPOINTS (require JWT in Authorization header):
 * - getTeams()            -> GET /api/events/:eventId/teams
 * - listPlayers(filters)  -> GET /api/events/:eventId/players?search=&role=&status=
 * - getOwners()           -> GET /api/events/:eventId/owners
 * - getAuctionBoard()     -> GET /api/auction/:eventId/state
 * - placeBid()            -> POST /api/auction/:eventId/bid
 * - markAuctionStatus()   -> PUT /api/auction/:eventId/lots/:lotId/status (admin only)
 * - finalizePurchase()    -> POST /api/auction/:eventId/purchase
 * 
 * WEBSOCKET EVENTS (future - for real-time auction):
 * - auction:bid           -> Receive bid updates
 * - auction:status        -> Receive lot status changes
 * - auction:timer         -> Receive timer sync
 * - auction:state         -> Full state sync on reconnect
 * 
 * Implementation Example:
 * -----------------------
 * async getEventSummary(eventId) {
 *   const response = await fetch(`/api/public/events/${eventId}`);
 *   if (!response.ok) throw new Error('Failed to fetch event');
 *   return response.json();
 * }
 * 
 * async placeBid({ eventId, auctionId, ownerId, amount }, token) {
 *   const response = await fetch(`/api/auction/${eventId}/bid`, {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${token}`
 *     },
 *     body: JSON.stringify({ lot_id: auctionId, owner_id: ownerId, amount })
 *   });
 *   if (!response.ok) throw new Error('Failed to place bid');
 *   return response.json();
 * }
 */

import {
  EVENT_SUMMARY,
  TEAM_CARDS,
  PLAYERS_POOL,
  OWNERS,
  AUCTION_BOARD,
  BID_INCREMENTS,
} from './eventsMockData.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const delay = async (ms = 120) => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const state = {
  players: clone(PLAYERS_POOL),
  teams: clone(TEAM_CARDS),
  owners: clone(OWNERS),
  auction: clone(AUCTION_BOARD),
};

const resolveAuctionContext = (auctionId) => {
  const auctionLot = state.auction.lots.find((lot) => lot.id === auctionId);
  if (!auctionLot) {
    throw new Error('Auction lot not found');
  }

  const player = state.players.find((item) => item.id === auctionLot.playerId);
  if (!player) {
    throw new Error('Player not found for auction lot');
  }

  return { auctionLot, player };
};

export const eventsService = {
  async getEventSummary() {
    await delay();
    return clone(EVENT_SUMMARY);
  },

  async getTeams() {
    await delay();
    return clone(state.teams);
  },

  async listPlayers(filters = {}) {
    await delay();

    const {
      search = '',
      role = 'all',
      teamId = 'all',
      status = 'all',
    } = filters;

    const normalized = search.trim().toLowerCase();

    return clone(state.players.filter((player) => {
      const isSearchMatch = !normalized || player.name.toLowerCase().includes(normalized) || player.team.toLowerCase().includes(normalized);
      const isRoleMatch = role === 'all' || player.role === role;
      const isTeamMatch = teamId === 'all' || player.teamId === teamId;
      const isStatusMatch = status === 'all' || player.status === status;
      return isSearchMatch && isRoleMatch && isTeamMatch && isStatusMatch;
    }));
  },

  async getOwners() {
    await delay();
    return clone(state.owners);
  },

  async getAuctionBoard() {
    await delay();
    return clone(state.auction);
  },

  async getBidIncrements() {
    await delay();
    return clone(BID_INCREMENTS);
  },

  async placeBid({ auctionId, ownerId, amount }) {
    await delay();

    if (!amount || amount <= 0) {
      throw new Error('Bid amount must be greater than zero');
    }

    const { auctionLot } = resolveAuctionContext(auctionId);

    if (auctionLot.status !== 'active') {
      throw new Error('Bids are only allowed for active lots');
    }

    if (amount <= auctionLot.currentBid) {
      throw new Error('Bid amount must be higher than current bid');
    }

    auctionLot.currentBid = amount;
    auctionLot.currentOwnerId = ownerId;

    return clone(auctionLot);
  },

  async markAuctionStatus({ auctionId, status }) {
    await delay();

    if (!['sold', 'unsold', 'active'].includes(status)) {
      throw new Error('Invalid auction status');
    }

    const { auctionLot, player } = resolveAuctionContext(auctionId);
    auctionLot.status = status;
    auctionLot.timeLeft = status === 'active' ? state.auction.lotDuration : 0;
    player.status = status;

    return clone(auctionLot);
  },

  async finalizePurchase({ auctionId, ownerId, amount }) {
    await delay();

    if (!amount || amount <= 0) {
      throw new Error('Purchase amount must be greater than zero');
    }

    const { auctionLot, player } = resolveAuctionContext(auctionId);

    auctionLot.currentOwnerId = ownerId;
    auctionLot.currentBid = amount;
    auctionLot.status = 'sold';
    auctionLot.timeLeft = 0;
    player.status = 'sold';
    player.nmCoin = amount;

    return clone({ auctionLot, player });
  },
};
