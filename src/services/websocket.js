// WebSocket Service for Real-time Auction Updates
import { io } from 'socket.io-client';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:5000';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.eventId = null;
    this.listeners = new Map();
  }

  // Connect to WebSocket server
  connect(eventId) {
    if (this.socket && this.socket.connected) {
      if (this.eventId === eventId) {
        return this.socket;
      }
      this.disconnect();
    }

    this.eventId = eventId;
    const token = localStorage.getItem('adminToken');
    
    this.socket = io(WS_BASE_URL, {
      auth: { token },
      query: { eventId },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      this.socket.emit('join-event', eventId);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return this.socket;
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventId = null;
      this.listeners.clear();
    }
  }

  // Subscribe to auction updates
  onAuctionUpdate(callback) {
    if (!this.socket) return;
    
    this.socket.on('auction-update', callback);
    this.listeners.set('auction-update', callback);
  }

  // Subscribe to bid placed
  onBidPlaced(callback) {
    if (!this.socket) return;
    
    this.socket.on('bid-placed', callback);
    this.listeners.set('bid-placed', callback);
  }

  // Subscribe to auction start
  onAuctionStart(callback) {
    if (!this.socket) return;
    
    this.socket.on('auction-start', callback);
    this.listeners.set('auction-start', callback);
  }

  // Subscribe to auction end
  onAuctionEnd(callback) {
    if (!this.socket) return;
    
    this.socket.on('auction-end', callback);
    this.listeners.set('auction-end', callback);
  }

  // Subscribe to team updates
  onTeamUpdate(callback) {
    if (!this.socket) return;
    
    this.socket.on('team-update', callback);
    this.listeners.set('team-update', callback);
  }

  // Subscribe to player updates
  onPlayerUpdate(callback) {
    if (!this.socket) return;
    
    this.socket.on('player-update', callback);
    this.listeners.set('player-update', callback);
  }

  // Subscribe to event updates
  onEventUpdate(callback) {
    if (!this.socket) return;
    
    this.socket.on('event-update', callback);
    this.listeners.set('event-update', callback);
  }

  // Emit admin action (start auction)
  emitStartAuction(playerId) {
    if (!this.socket) return;
    this.socket.emit('admin:start-auction', { playerId });
  }

  // Emit admin action (end auction)
  emitEndAuction() {
    if (!this.socket) return;
    this.socket.emit('admin:end-auction');
  }

  // Emit admin action (reset auction)
  emitResetAuction() {
    if (!this.socket) return;
    this.socket.emit('admin:reset-auction');
  }

  // Remove all listeners
  removeAllListeners() {
    if (!this.socket) return;
    
    this.listeners.forEach((callback, event) => {
      this.socket.off(event, callback);
    });
    
    this.listeners.clear();
  }

  // Check if connected
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Export singleton instance
const wsService = new WebSocketService();
export default wsService;
