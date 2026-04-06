// API Service Layer for Backend Integration
import { mockEvents, mockPlayers, mockTeams, mockStats, mockAuctionState, delay } from './mockData.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_API_BASE_URL;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.useMock = USE_MOCK_DATA;
    
    // Mock data storage (simulates database)
    this.mockStorage = {
      events: [...mockEvents],
      players: [...mockPlayers],
      teams: [...mockTeams],
      auctionState: { ...mockAuctionState }
    };
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Generic request handler
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async adminLogin(credentials) {
    const data = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (data.token) {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
    }
    
    return data;
  }

  async adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }

  isAdminAuthenticated() {
    return !!localStorage.getItem('adminToken');
  }

  getAdminUser() {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  }

  // Event Management endpoints
  async getEvents() {
    if (this.useMock) {
      await delay();
      return { events: this.mockStorage.events };
    }
    return this.request('/events');
  }

  async getEventById(eventId) {
    if (this.useMock) {
      await delay();
      const event = this.mockStorage.events.find(e => e._id === eventId);
      if (!event) throw new Error('Event not found');
      return event;
    }
    return this.request(`/events/${eventId}`);
  }

  async createEvent(eventData) {
    if (this.useMock) {
      await delay();
      const newEvent = {
        _id: 'event' + (this.mockStorage.events.length + 1),
        ...eventData,
        playerCount: 0,
        teamCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.mockStorage.events.push(newEvent);
      return newEvent;
    }
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(eventId, eventData) {
    if (this.useMock) {
      await delay();
      const index = this.mockStorage.events.findIndex(e => e._id === eventId);
      if (index === -1) throw new Error('Event not found');
      this.mockStorage.events[index] = {
        ...this.mockStorage.events[index],
        ...eventData,
        updatedAt: new Date().toISOString()
      };
      return this.mockStorage.events[index];
    }
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(eventId) {
    if (this.useMock) {
      await delay();
      this.mockStorage.events = this.mockStorage.events.filter(e => e._id !== eventId);
      return { message: 'Event deleted successfully' };
    }
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async publishEvent(eventId) {
    if (this.useMock) {
      await delay();
      const event = this.mockStorage.events.find(e => e._id === eventId);
      if (!event) throw new Error('Event not found');
      event.isPublished = true;
      return event;
    }
    return this.request(`/events/${eventId}/publish`, {
      method: 'POST',
    });
  }

  async unpublishEvent(eventId) {
    if (this.useMock) {
      await delay();
      const event = this.mockStorage.events.find(e => e._id === eventId);
      if (!event) throw new Error('Event not found');
      event.isPublished = false;
      return event;
    }
    return this.request(`/events/${eventId}/unpublish`, {
      method: 'POST',
    });
  }

  // Player Management endpoints
  async getPlayers(eventId) {
    if (this.useMock) {
      await delay();
      return { players: this.mockStorage.players.filter(p => p.eventId === eventId) };
    }
    return this.request(`/events/${eventId}/players`);
  }

  async addPlayer(eventId, playerData) {
    if (this.useMock) {
      await delay();
      const newPlayer = {
        _id: 'player' + (this.mockStorage.players.length + 1),
        ...playerData,
        eventId,
        teamId: null,
        soldPrice: null
      };
      this.mockStorage.players.push(newPlayer);
      return newPlayer;
    }
    return this.request(`/events/${eventId}/players`, {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  }

  async updatePlayer(eventId, playerId, playerData) {
    if (this.useMock) {
      await delay();
      const index = this.mockStorage.players.findIndex(p => p._id === playerId);
      if (index === -1) throw new Error('Player not found');
      this.mockStorage.players[index] = {
        ...this.mockStorage.players[index],
        ...playerData
      };
      return this.mockStorage.players[index];
    }
    return this.request(`/events/${eventId}/players/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  }

  async deletePlayer(eventId, playerId) {
    if (this.useMock) {
      await delay();
      this.mockStorage.players = this.mockStorage.players.filter(p => p._id !== playerId);
      return { message: 'Player deleted successfully' };
    }
    return this.request(`/events/${eventId}/players/${playerId}`, {
      method: 'DELETE',
    });
  }

  // Team Management endpoints
  async getTeams(eventId) {
    if (this.useMock) {
      await delay();
      return { teams: this.mockStorage.teams.filter(t => t.eventId === eventId) };
    }
    return this.request(`/events/${eventId}/teams`);
  }

  async createTeam(eventId, teamData) {
    if (this.useMock) {
      await delay();
      const newTeam = {
        _id: 'team' + (this.mockStorage.teams.length + 1),
        ...teamData,
        eventId
      };
      this.mockStorage.teams.push(newTeam);
      return newTeam;
    }
    return this.request(`/events/${eventId}/teams`, {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  async updateTeam(eventId, teamId, teamData) {
    if (this.useMock) {
      await delay();
      const index = this.mockStorage.teams.findIndex(t => t._id === teamId);
      if (index === -1) throw new Error('Team not found');
      this.mockStorage.teams[index] = {
        ...this.mockStorage.teams[index],
        ...teamData
      };
      return this.mockStorage.teams[index];
    }
    return this.request(`/events/${eventId}/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  }

  async deleteTeam(eventId, teamId) {
    if (this.useMock) {
      await delay();
      this.mockStorage.teams = this.mockStorage.teams.filter(t => t._id !== teamId);
      return { message: 'Team deleted successfully' };
    }
    return this.request(`/events/${eventId}/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  // Auction Management endpoints
  async getAuctionState(eventId) {
    if (this.useMock) {
      await delay();
      return this.mockStorage.auctionState;
    }
    return this.request(`/events/${eventId}/auction/state`);
  }

  async startAuction(eventId, playerId) {
    if (this.useMock) {
      await delay();
      const player = this.mockStorage.players.find(p => p._id === playerId);
      if (!player) throw new Error('Player not found');
      
      this.mockStorage.auctionState = {
        isActive: true,
        currentPlayer: player,
        currentBid: player.basePrice,
        currentBidder: null,
        startTime: new Date().toISOString(),
        duration: 60,
        bids: []
      };
      return this.mockStorage.auctionState;
    }
    return this.request(`/events/${eventId}/auction/start`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  }

  async placeBid(eventId, bidData) {
    if (this.useMock) {
      await delay();
      if (!this.mockStorage.auctionState.isActive) {
        throw new Error('No active auction');
      }
      
      this.mockStorage.auctionState.currentBid = bidData.amount;
      this.mockStorage.auctionState.currentBidder = bidData.teamId;
      this.mockStorage.auctionState.bids.push({
        ...bidData,
        timestamp: new Date().toISOString()
      });
      return this.mockStorage.auctionState;
    }
    return this.request(`/events/${eventId}/auction/bid`, {
      method: 'POST',
      body: JSON.stringify(bidData),
    });
  }

  async endAuction(eventId) {
    if (this.useMock) {
      await delay();
      if (!this.mockStorage.auctionState.isActive) {
        throw new Error('No active auction');
      }
      
      const { currentPlayer, currentBid, currentBidder } = this.mockStorage.auctionState;
      
      // Update player if sold
      if (currentBidder) {
        const playerIndex = this.mockStorage.players.findIndex(p => p._id === currentPlayer._id);
        if (playerIndex !== -1) {
          this.mockStorage.players[playerIndex].teamId = currentBidder;
          this.mockStorage.players[playerIndex].soldPrice = currentBid;
        }
      }
      
      this.mockStorage.auctionState = {
        isActive: false,
        currentPlayer: null,
        currentBid: null,
        currentBidder: null,
        startTime: null,
        duration: 60,
        bids: []
      };
      
      return { message: 'Auction ended', player: currentPlayer };
    }
    return this.request(`/events/${eventId}/auction/end`, {
      method: 'POST',
    });
  }

  async resetAuction(eventId) {
    if (this.useMock) {
      await delay();
      
      // Reset all players
      this.mockStorage.players = this.mockStorage.players.map(p => ({
        ...p,
        teamId: null,
        soldPrice: null
      }));
      
      this.mockStorage.auctionState = {
        isActive: false,
        currentPlayer: null,
        currentBid: null,
        currentBidder: null,
        startTime: null,
        duration: 60,
        bids: []
      };
      
      return { message: 'Auction reset successfully' };
    }
    return this.request(`/events/${eventId}/auction/reset`, {
      method: 'POST',
    });
  }

  // Stats endpoints
  async getEventStats(eventId) {
    if (this.useMock) {
      await delay();
      const event = this.mockStorage.events.find(e => e._id === eventId);
      if (!event) throw new Error('Event not found');
      
      const players = this.mockStorage.players.filter(p => p.eventId === eventId);
      const teams = this.mockStorage.teams.filter(t => t.eventId === eventId);
      
      return {
        totalPlayers: players.length,
        soldPlayers: players.filter(p => p.teamId).length,
        totalTeams: teams.length
      };
    }
    return this.request(`/events/${eventId}/stats`);
  }

  async getDashboardStats() {
    if (this.useMock) {
      await delay();
      return mockStats;
    }
    return this.request('/admin/stats');
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
