# Admin Dashboard - Event Management System

## Overview

The admin dashboard provides a comprehensive interface for managing esports events and conducting real-time player auctions. Built with React 19, it features a modern UI with WebSocket integration for live updates.

## Features

### 1. Event Management
- **Create/Edit Events**: Full CRUD operations for events
- **Event Publishing**: Control event visibility to users
- **Event Configuration**: 
  - Event dates and location
  - Team limits and player slots
  - Team purse/budget settings
  - Registration deadlines

### 2. Real-Time Auction Manager
- **Live Auction Control**: Start/end auctions for individual players
- **Real-Time Bidding**: Live updates via WebSocket
- **Countdown Timer**: Visual timer for auction duration
- **Bid Tracking**: View all bids in real-time
- **Player Status**: Track sold/unsold players
- **Team Management**: View team rosters and budgets

### 3. Teams Overview
- **Team Roster**: View players purchased by each team
- **Budget Tracking**: Monitor spent and remaining purse
- **Player Count**: Track squad composition
- **Financial Summary**: Real-time budget calculations

## Routes

### Frontend Routes
- `/admin/login` - Admin login page
- `/dashboard` - Main admin dashboard (protected)

### API Endpoints (Backend Integration)

#### Authentication
- `POST /api/admin/login` - Admin login
- Returns JWT token stored in localStorage

#### Event Management
- `GET /api/events` - Get all events
- `GET /api/events/:eventId` - Get single event
- `POST /api/events` - Create new event
- `PUT /api/events/:eventId` - Update event
- `DELETE /api/events/:eventId` - Delete event
- `POST /api/events/:eventId/publish` - Publish event
- `POST /api/events/:eventId/unpublish` - Unpublish event

#### Player Management
- `GET /api/events/:eventId/players` - Get all players
- `POST /api/events/:eventId/players` - Add player
- `PUT /api/events/:eventId/players/:playerId` - Update player
- `DELETE /api/events/:eventId/players/:playerId` - Delete player

#### Team Management
- `GET /api/events/:eventId/teams` - Get all teams
- `POST /api/events/:eventId/teams` - Create team
- `PUT /api/events/:eventId/teams/:teamId` - Update team
- `DELETE /api/events/:eventId/teams/:teamId` - Delete team

#### Auction Management
- `GET /api/events/:eventId/auction/state` - Get auction state
- `POST /api/events/:eventId/auction/start` - Start auction for player
- `POST /api/events/:eventId/auction/bid` - Place bid (team action)
- `POST /api/events/:eventId/auction/end` - End current auction
- `POST /api/events/:eventId/auction/reset` - Reset entire auction

#### Statistics
- `GET /api/admin/stats` - Get dashboard statistics

## WebSocket Events

### Client Listens To:
- `auction-update` - General auction state changes
- `bid-placed` - New bid placed
- `auction-start` - Auction started for a player
- `auction-end` - Auction ended
- `team-update` - Team data updated
- `player-update` - Player data updated
- `event-update` - Event data updated

### Client Emits:
- `join-event` - Join event room (with eventId)
- `admin:start-auction` - Admin starts auction
- `admin:end-auction` - Admin ends auction
- `admin:reset-auction` - Admin resets auction

## Components Structure

```
src/
├── pages/
│   ├── AdminLoginPage.jsx          # Admin authentication
│   └── DashboardPage.jsx            # Main dashboard container
├── components/
│   ├── routing/
│   │   └── ProtectedAdminRoute.jsx # Auth route guard
│   └── sections/
│       └── dashboard/
│           ├── EventList.jsx        # Event list & management
│           ├── EventForm.jsx        # Create/edit event form
│           └── AuctionManager.jsx   # Live auction interface
└── services/
    ├── api.js                       # API service layer
    └── websocket.js                 # WebSocket service

```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install socket.io-client
```

### 2. Environment Variables
Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_BASE_URL=http://localhost:5000
```

### 3. Development
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Usage Guide

### Admin Login
1. Navigate to `/admin/login`
2. Enter admin credentials
3. JWT token stored in localStorage
4. Redirected to `/dashboard`

### Creating an Event
1. Click "CREATE EVENT" button
2. Fill in event details:
   - Name, description, dates
   - Location
   - Max teams and players per team
   - Team purse/budget
   - Registration deadline
3. Toggle "Publish Event" to make visible
4. Click "CREATE EVENT" or "UPDATE EVENT"

### Managing Auction
1. Click "AUCTION" button on any event
2. In Live Auction view:
   - Click Play button next to player to start auction
   - Timer starts automatically
   - Monitor bids in real-time
   - Click "SOLD!" to award player to highest bidder
   - Click "UNSOLD" to skip player
3. Switch to "TEAMS OVERVIEW" to see:
   - Team rosters
   - Budget utilization
   - Player counts

### Real-Time Features
- **Auto-refresh**: Dashboard updates automatically via WebSocket
- **Live bidding**: Bids appear instantly without page refresh
- **Timer sync**: Countdown syncs across all connected clients
- **Status updates**: Player/team status updates in real-time

## Security

### Authentication
- JWT token-based authentication
- Token stored in localStorage
- Protected routes redirect to login if unauthenticated
- Token included in all API requests via Authorization header

### Route Protection
- `ProtectedAdminRoute` wrapper component
- Checks authentication before rendering
- Automatic redirect to `/admin/login`

## API Service Layer

### Features
- Centralized API calls
- Automatic token injection
- Error handling
- Response parsing
- Token management (login/logout)

### Usage Example
```javascript
import apiService from '../services/api.js';

// Login
await apiService.adminLogin({ username, password });

// Create event
const event = await apiService.createEvent(eventData);

// Start auction
await apiService.startAuction(eventId, playerId);
```

## WebSocket Service Layer

### Features
- Singleton WebSocket connection
- Event-based subscription model
- Auto-reconnection
- Room management (join-event)
- Cleanup utilities

### Usage Example
```javascript
import wsService from '../services/websocket.js';

// Connect
wsService.connect(eventId);

// Subscribe to updates
wsService.onBidPlaced((data) => {
  console.log('New bid:', data);
});

// Cleanup
wsService.disconnect();
```

## Styling

- **Framework**: Tailwind CSS 4.2.1
- **Theme**: Custom brutal/cyberpunk aesthetic
- **Colors**: 
  - Primary: Yellow/gold (`text-primary`)
  - Success: Green (`text-green-400`)
  - Error: Red (`text-red-400`)
  - Background: Black with opacity variants
- **Components**: 
  - `.brutal-border` - Brutalist border style
  - Responsive grid layouts
  - Mobile-friendly navigation

## Browser Support

- Modern browsers with WebSocket support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### WebSocket Connection Issues
- Check `VITE_WS_BASE_URL` environment variable
- Ensure backend WebSocket server is running
- Check browser console for connection errors
- Verify CORS configuration on backend

### Authentication Issues
- Clear localStorage and re-login
- Check token expiration on backend
- Verify API base URL is correct
- Check network tab for 401 errors

### Real-Time Updates Not Working
- Verify WebSocket connection in console
- Check that event room was joined (`join-event`)
- Ensure event ID is correct
- Check backend socket event emissions

## Future Enhancements

- [ ] Player import from CSV/Excel
- [ ] Auction history and analytics
- [ ] Email notifications for events
- [ ] Multi-language support
- [ ] Dark/light theme toggle
- [ ] Auction replay feature
- [ ] Export team rosters to PDF
- [ ] Real-time chat for admins
- [ ] Automated bidding rules
- [ ] Player comparison tools

## Performance Considerations

- WebSocket connection pooling
- Lazy loading for player lists
- Virtualized lists for large datasets
- Optimized re-renders with React.memo
- Debounced API calls
- Client-side caching

## License

Part of the Nightmare Esports platform.
