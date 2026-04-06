// Mock API Service for Development
// This file provides mock data when backend is not available

export const mockEvents = [
  {
    _id: 'event1',
    name: 'NIGHTMARE CUP 2026',
    description: 'The biggest esports tournament of the year featuring top teams from around the world.',
    startDate: '2026-05-01T00:00:00.000Z',
    endDate: '2026-05-10T00:00:00.000Z',
    location: 'Mumbai, India',
    maxTeams: 8,
    maxPlayersPerTeam: 11,
    registrationDeadline: '2026-04-20T00:00:00.000Z',
    pursePerTeam: 1000000,
    isPublished: true,
    playerCount: 88,
    teamCount: 8,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-15T00:00:00.000Z'
  },
  {
    _id: 'event2',
    name: 'SUMMER SHOWDOWN 2026',
    description: 'Regional tournament for emerging teams and players.',
    startDate: '2026-06-15T00:00:00.000Z',
    endDate: '2026-06-20T00:00:00.000Z',
    location: 'Delhi, India',
    maxTeams: 6,
    maxPlayersPerTeam: 11,
    registrationDeadline: '2026-06-01T00:00:00.000Z',
    pursePerTeam: 500000,
    isPublished: false,
    playerCount: 66,
    teamCount: 6,
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z'
  }
];

export const mockPlayers = [
  {
    _id: 'player1',
    name: 'Virat Sharma',
    role: 'Batsman',
    basePrice: 200000,
    teamId: null,
    soldPrice: null,
    eventId: 'event1',
    stats: { matches: 50, rating: 92 }
  },
  {
    _id: 'player2',
    name: 'Rohit Kumar',
    role: 'All-Rounder',
    basePrice: 300000,
    teamId: null,
    soldPrice: null,
    eventId: 'event1',
    stats: { matches: 48, rating: 88 }
  },
  {
    _id: 'player3',
    name: 'MS Patel',
    role: 'Wicket-Keeper',
    basePrice: 250000,
    teamId: null,
    soldPrice: null,
    eventId: 'event1',
    stats: { matches: 55, rating: 90 }
  },
  {
    _id: 'player4',
    name: 'Jasprit Singh',
    role: 'Bowler',
    basePrice: 180000,
    teamId: null,
    soldPrice: null,
    eventId: 'event1',
    stats: { matches: 45, rating: 87 }
  },
  {
    _id: 'player5',
    name: 'Hardik Verma',
    role: 'All-Rounder',
    basePrice: 280000,
    teamId: null,
    soldPrice: null,
    eventId: 'event1',
    stats: { matches: 42, rating: 85 }
  }
];

export const mockTeams = [
  {
    _id: 'team1',
    name: 'Mumbai Warriors',
    ownerName: 'Raj Mehta',
    eventId: 'event1',
    purse: 1000000
  },
  {
    _id: 'team2',
    name: 'Delhi Titans',
    ownerName: 'Priya Sharma',
    eventId: 'event1',
    purse: 1000000
  },
  {
    _id: 'team3',
    name: 'Bangalore Kings',
    ownerName: 'Amit Patel',
    eventId: 'event1',
    purse: 1000000
  },
  {
    _id: 'team4',
    name: 'Chennai Legends',
    ownerName: 'Sneha Kumar',
    eventId: 'event1',
    purse: 1000000
  }
];

export const mockStats = {
  totalEvents: 2,
  activeEvents: 1,
  totalPlayers: 154,
  totalTeams: 14
};

export const mockAuctionState = {
  isActive: false,
  currentPlayer: null,
  currentBid: null,
  currentBidder: null,
  startTime: null,
  duration: 60,
  bids: []
};

// Helper to simulate API delay
export const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));
