import { config } from '../config.js';

const toRoleLabel = (role) => {
  if (!role) return '-';
  return String(role);
};

const toPlayerStatusLabel = (status) => {
  if (!status) return 'active';
  return String(status).toLowerCase();
};

const toAuctionStatusLabel = (status) => {
  if (!status) return 'pending';
  return String(status).toLowerCase();
};

const formatApiError = (payload, fallbackMessage) => {
  const baseMessage = payload?.message || fallbackMessage;

  if (Array.isArray(payload?.details) && payload.details.length > 0) {
    const first = payload.details[0];
    if (first?.path && first?.message) {
      return `${baseMessage} (${first.path}: ${first.message})`;
    }
  }

  if (payload?.code) {
    return `${baseMessage} [${payload.code}]`;
  }

  return baseMessage;
};

const request = async (path, { method = 'GET', body, token } = {}) => {
  const response = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(formatApiError(payload, 'Request could not be completed'));
  }

  return payload.data;
};

const buildAuctionBoardQuery = (filters = {}) => {
  const searchParams = new URLSearchParams();

  if (filters.search) {
    searchParams.set('search', String(filters.search).trim());
  }

  if (filters.status && filters.status !== 'all') {
    searchParams.set('status', String(filters.status).toUpperCase());
  }

  if (filters.ownerName) {
    searchParams.set('ownerName', String(filters.ownerName).trim());
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const mapSummary = (summary) => ({
  id: summary.id,
  title: summary.title,
  season: summary.season,
  game: summary.game,
  mode: summary.mode,
  registration: summary.registrationCount,
  slots: summary.maxSlots,
  streamStart: summary.streamStartTime,
  auctionWindow: `${summary.auctionWindowSeconds}s per player`,
  banner: summary.bannerUrl,
  sponsorImageUrl: summary.sponsorImageUrl,
  status: summary.status,
});

const mapOwner = (owner) => ({
  id: owner.id,
  name: owner.name,
  email: owner.email,
  avatar: owner.avatarUrl,
  avatarUrl: owner.avatarUrl,
  teamId: owner.teamId || '',
});

const mapTeam = (team) => ({
  id: team.id,
  name: team.name,
  ownerName: team.owner?.name || '-',
  ownerAvatar: team.owner?.avatarUrl || '',
  players: team.players || [],
  playersSold: (team.players || []).length,
  roster: (team.players || []).map((player) => player.imageUrl).filter(Boolean),
  coinsLeft: team.coinsLeft,
  ownerId: team.ownerId,
});

const mapPlayer = (player) => ({
  id: player.id,
  name: player.name,
  email: player.email,
  teamId: player.soldToTeamId || 'unassigned',
  team: player.soldToTeam?.name || 'Unassigned',
  role: toRoleLabel(player.role),
  rank: player.rank,
  nmCoin: player.finalPrice || player.basePrice,
  status: toPlayerStatusLabel(player.status),
  image: player.imageUrl,
});

const mapAuctionBoard = (board, players, owners) => {
  const playerById = Object.fromEntries(players.map((player) => [player.id, player]));
  const ownerById = Object.fromEntries(owners.map((owner) => [owner.id, owner]));

  return {
    activeAuctionId: board.activeAuctionId,
    lotDuration: board.lotDuration,
    lots: (board.lots || []).map((lot) => ({
      id: lot.id,
      playerId: lot.playerId,
      currentBid: lot.currentBid,
      currentOwnerId: lot.currentOwnerId,
      status: toAuctionStatusLabel(lot.status),
      timeLeft: lot.timeLeft,
      lotOrder: lot.lotOrder,
      playerName: lot.playerName || playerById[lot.playerId]?.name,
      playerRole: lot.playerRole || playerById[lot.playerId]?.role || '-',
      playerImageUrl: lot.playerImageUrl || playerById[lot.playerId]?.image || '',
      ownerName: lot.currentOwnerName || ownerById[lot.currentOwnerId]?.name,
    })),
  };
};

export const eventsService = {
  async listPublicEvents() {
    return await request('/events');
  },

  async getLoginContext(eventId) {
    return await request(`/events/${eventId}/login-context`);
  },

  async getSignupContext(eventId) {
    return await request(`/events/${eventId}/signup-context`);
  },

  async signupOwner(eventId, payload) {
    return await request(`/events/${eventId}/signup/owner`, {
      method: 'POST',
      body: payload,
    });
  },

  async signupPlayer(eventId, payload) {
    return await request(`/events/${eventId}/signup/player`, {
      method: 'POST',
      body: payload,
    });
  },

  async uploadPublicImage(file, { folder } = {}) {
    const formData = new FormData();
    formData.append('image', file);

    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(`${config.apiUrl}/admin/upload/image`, {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(formatApiError(payload, 'Image upload could not be completed'));
    }

    return payload.data;
  },

  async getEventSummary(eventId, sessionToken) {
    const data = await request(`/events/${eventId}/summary`, {
      token: sessionToken,
    });
    return mapSummary(data);
  },

  async getTeams(eventId, sessionToken) {
    const data = await request(`/events/${eventId}/teams`, {
      token: sessionToken,
    });
    return data.map(mapTeam);
  },

  async listPlayers(eventId, sessionToken, filters = {}) {
    const searchParams = new URLSearchParams();
    if (filters.search) {
      searchParams.set('search', filters.search);
    }
    if (filters.role && filters.role !== 'all') {
      searchParams.set('role', filters.role);
    }
    if (filters.status && filters.status !== 'all') {
      searchParams.set('status', String(filters.status).toUpperCase());
    }

    const query = searchParams.toString();
    const path = `/events/${eventId}/players${query ? `?${query}` : ''}`;

    const data = await request(path, {
      token: sessionToken,
    });

    const mapped = data.map(mapPlayer);
    if (filters.teamId && filters.teamId !== 'all') {
      return mapped.filter((player) => player.teamId === filters.teamId);
    }
    return mapped;
  },

  async getOwners(eventId, sessionToken) {
    const data = await request(`/events/${eventId}/owners`, {
      token: sessionToken,
    });
    return data.map(mapOwner);
  },

  async getAuctionBoard(eventId, sessionToken, filters = {}) {
    const boardQuery = buildAuctionBoardQuery(filters);

    const [board, players, owners] = await Promise.all([
      request(`/events/${eventId}/auction${boardQuery}`, { token: sessionToken }),
      request(`/events/${eventId}/players`, { token: sessionToken }),
      request(`/events/${eventId}/owners`, { token: sessionToken }),
    ]);

    return mapAuctionBoard(board, players.map(mapPlayer), owners.map(mapOwner));
  },

  async getBidIncrements() {
    return [100, 500, 1000];
  },

  async placeBid({ eventId, sessionToken, auctionId, ownerId, amount }) {
    return await request(`/auction/${eventId}/bid`, {
      method: 'POST',
      token: sessionToken,
      body: {
        lotId: auctionId,
        ownerId,
        amount,
      },
    });
  },

  async markAuctionStatus({ eventId, adminToken, auctionId, status }) {
    return await request(`/auction/${eventId}/lots/${auctionId}/status`, {
      method: 'POST',
      token: adminToken,
      body: { status },
    });
  },

  async finalizePurchase({ eventId, adminToken, auctionId, ownerId, amount }) {
    return await request(`/auction/${eventId}/lots/${auctionId}/finalize`, {
      method: 'POST',
      token: adminToken,
      body: {
        lotId: auctionId,
        ownerId,
        amount,
      },
    });
  },

  async startAuction({ eventId, adminToken, autoProgress }) {
    const body = typeof autoProgress === 'boolean' ? { autoProgress } : {};

    return await request(`/auction/${eventId}/start`, {
      method: 'POST',
      token: adminToken,
      body,
    });
  },

  async stopAuction({ eventId, adminToken }) {
    return await request(`/auction/${eventId}/stop`, {
      method: 'POST',
      token: adminToken,
    });
  },

  async nextLot({ eventId, adminToken }) {
    return await request(`/auction/${eventId}/next-lot`, {
      method: 'POST',
      token: adminToken,
    });
  },

  async manualLotOverride({ eventId, adminToken, lotId, status }) {
    return await request(`/auction/${eventId}/manual-lot-override`, {
      method: 'POST',
      token: adminToken,
      body: { lotId, status },
    });
  },
};
