# Backend Integration Guide

## Required Backend Endpoints

This document outlines the backend API endpoints and WebSocket events that need to be implemented to support the admin dashboard.

## Authentication

### Admin Login
**Endpoint**: `POST /api/admin/login`

**Request Body**:
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response**:
```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "username": "admin",
    "name": "Admin Name",
    "role": "Administrator"
  }
}
```

## Event Endpoints

### Get All Events
**Endpoint**: `GET /api/events`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "events": [
    {
      "_id": "event_id",
      "name": "NIGHTMARE CUP 2026",
      "description": "Event description",
      "startDate": "2026-05-01T00:00:00.000Z",
      "endDate": "2026-05-10T00:00:00.000Z",
      "location": "Mumbai, India",
      "maxTeams": 8,
      "maxPlayersPerTeam": 11,
      "registrationDeadline": "2026-04-20T00:00:00.000Z",
      "pursePerTeam": 1000000,
      "isPublished": true,
      "playerCount": 88,
      "teamCount": 8,
      "createdAt": "2026-03-01T00:00:00.000Z",
      "updatedAt": "2026-03-15T00:00:00.000Z"
    }
  ]
}
```

### Get Single Event
**Endpoint**: `GET /api/events/:eventId`

**Headers**: `Authorization: Bearer <token>`

**Response**: Same as single event object above

### Create Event
**Endpoint**: `POST /api/events`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "NIGHTMARE CUP 2026",
  "description": "Event description",
  "startDate": "2026-05-01",
  "endDate": "2026-05-10",
  "location": "Mumbai, India",
  "maxTeams": 8,
  "maxPlayersPerTeam": 11,
  "registrationDeadline": "2026-04-20",
  "pursePerTeam": 1000000,
  "isPublished": false
}
```

**Response**: Event object

### Update Event
**Endpoint**: `PUT /api/events/:eventId`

**Headers**: `Authorization: Bearer <token>`

**Request Body**: Same as create event

**Response**: Updated event object

### Delete Event
**Endpoint**: `DELETE /api/events/:eventId`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Event deleted successfully"
}
```

### Publish Event
**Endpoint**: `POST /api/events/:eventId/publish`

**Headers**: `Authorization: Bearer <token>`

**Response**: Updated event object with `isPublished: true`

### Unpublish Event
**Endpoint**: `POST /api/events/:eventId/unpublish`

**Headers**: `Authorization: Bearer <token>`

**Response**: Updated event object with `isPublished: false`

## Player Endpoints

### Get All Players
**Endpoint**: `GET /api/events/:eventId/players`

**Response**:
```json
{
  "players": [
    {
      "_id": "player_id",
      "name": "Player Name",
      "role": "Batsman",
      "basePrice": 100000,
      "teamId": "team_id",
      "soldPrice": 500000,
      "eventId": "event_id",
      "stats": {
        "matches": 50,
        "rating": 85
      }
    }
  ]
}
```

### Add Player
**Endpoint**: `POST /api/events/:eventId/players`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Player Name",
  "role": "Batsman",
  "basePrice": 100000,
  "stats": {
    "matches": 50,
    "rating": 85
  }
}
```

**Response**: Player object

### Update Player
**Endpoint**: `PUT /api/events/:eventId/players/:playerId`

**Headers**: `Authorization: Bearer <token>`

**Request Body**: Same as add player

**Response**: Updated player object

### Delete Player
**Endpoint**: `DELETE /api/events/:eventId/players/:playerId`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Player deleted successfully"
}
```

## Team Endpoints

### Get All Teams
**Endpoint**: `GET /api/events/:eventId/teams`

**Response**:
```json
{
  "teams": [
    {
      "_id": "team_id",
      "name": "Team Name",
      "ownerName": "Owner Name",
      "eventId": "event_id",
      "purse": 1000000,
      "players": []
    }
  ]
}
```

### Create Team
**Endpoint**: `POST /api/events/:eventId/teams`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Team Name",
  "ownerName": "Owner Name"
}
```

**Response**: Team object

### Update Team
**Endpoint**: `PUT /api/events/:eventId/teams/:teamId`

**Headers**: `Authorization: Bearer <token>`

**Request Body**: Same as create team

**Response**: Updated team object

### Delete Team
**Endpoint**: `DELETE /api/events/:eventId/teams/:teamId`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Team deleted successfully"
}
```

## Auction Endpoints

### Get Auction State
**Endpoint**: `GET /api/events/:eventId/auction/state`

**Response**:
```json
{
  "isActive": true,
  "currentPlayer": {
    "_id": "player_id",
    "name": "Player Name",
    "role": "Batsman",
    "basePrice": 100000
  },
  "currentBid": 500000,
  "currentBidder": "team_id",
  "startTime": "2026-04-02T10:30:00.000Z",
  "duration": 60,
  "bids": [
    {
      "teamId": "team_id",
      "amount": 500000,
      "timestamp": "2026-04-02T10:30:15.000Z"
    }
  ]
}
```

### Start Auction
**Endpoint**: `POST /api/events/:eventId/auction/start`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "playerId": "player_id"
}
```

**Response**: Auction state object

**Side Effect**: Emit `auction-start` WebSocket event

### Place Bid
**Endpoint**: `POST /api/events/:eventId/auction/bid`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "teamId": "team_id",
  "amount": 500000
}
```

**Response**: Updated auction state

**Side Effect**: Emit `bid-placed` WebSocket event

### End Auction
**Endpoint**: `POST /api/events/:eventId/auction/end`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Auction ended",
  "player": {
    "_id": "player_id",
    "teamId": "winning_team_id",
    "soldPrice": 500000
  }
}
```

**Side Effect**: 
- Update player with teamId and soldPrice
- Emit `auction-end` WebSocket event
- Emit `player-update` WebSocket event

### Reset Auction
**Endpoint**: `POST /api/events/:eventId/auction/reset`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Auction reset successfully"
}
```

**Side Effect**:
- Clear all teamId and soldPrice from players
- Emit `auction-update` WebSocket event
- Emit `player-update` WebSocket event

## Statistics Endpoint

### Get Dashboard Stats
**Endpoint**: `GET /api/admin/stats`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "totalEvents": 5,
  "activeEvents": 2,
  "totalPlayers": 440,
  "totalTeams": 40
}
```

## WebSocket Events

### Connection
**URL**: `ws://localhost:5000` or configured WS_BASE_URL

**Auth**: Send token in connection auth:
```javascript
io(WS_URL, {
  auth: { token: 'jwt_token' },
  query: { eventId: 'event_id' }
})
```

### Server Should Emit

#### auction-update
Emitted when auction state changes
```json
{
  "isActive": true,
  "currentPlayer": { /* player object */ },
  "currentBid": 500000,
  "currentBidder": "team_id"
}
```

#### bid-placed
Emitted when a new bid is placed
```json
{
  "teamId": "team_id",
  "amount": 500000,
  "timestamp": "2026-04-02T10:30:15.000Z"
}
```

#### auction-start
Emitted when auction starts for a player
```json
{
  "isActive": true,
  "currentPlayer": { /* player object */ },
  "startTime": "2026-04-02T10:30:00.000Z",
  "duration": 60
}
```

#### auction-end
Emitted when auction ends
```json
{
  "isActive": false,
  "soldPlayer": {
    "_id": "player_id",
    "teamId": "team_id",
    "soldPrice": 500000
  }
}
```

#### team-update
Emitted when team data changes
```json
{
  "team": { /* team object */ }
}
```

#### player-update
Emitted when player data changes
```json
{
  "player": { /* player object */ }
}
```

#### event-update
Emitted when event data changes
```json
{
  "event": { /* event object */ }
}
```

### Client Should Emit

#### join-event
Join event room for updates
```javascript
socket.emit('join-event', eventId);
```

#### admin:start-auction
Admin starts auction (optional, can use HTTP endpoint)
```javascript
socket.emit('admin:start-auction', { playerId: 'player_id' });
```

#### admin:end-auction
Admin ends auction (optional, can use HTTP endpoint)
```javascript
socket.emit('admin:end-auction');
```

#### admin:reset-auction
Admin resets auction (optional, can use HTTP endpoint)
```javascript
socket.emit('admin:reset-auction');
```

## CORS Configuration

Ensure backend allows requests from frontend origin:

```javascript
// Express CORS example
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));

// Socket.io CORS
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});
```

## Error Handling

All endpoints should return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "message": "Error description",
  "errors": {
    "field": "Field-specific error"
  }
}
```

## Database Schema Suggestions

### Event Model
```javascript
{
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  location: String,
  maxTeams: Number,
  maxPlayersPerTeam: Number,
  registrationDeadline: Date,
  pursePerTeam: Number,
  isPublished: Boolean,
  createdBy: ObjectId, // Admin user
  timestamps: true
}
```

### Player Model
```javascript
{
  name: String,
  role: String,
  basePrice: Number,
  eventId: ObjectId,
  teamId: ObjectId, // null if unsold
  soldPrice: Number, // null if unsold
  stats: Object,
  timestamps: true
}
```

### Team Model
```javascript
{
  name: String,
  ownerName: String,
  eventId: ObjectId,
  userId: ObjectId, // Team owner login
  purse: Number,
  timestamps: true
}
```

### Auction State Model (In-Memory or Cache)
```javascript
{
  eventId: ObjectId,
  isActive: Boolean,
  currentPlayer: ObjectId,
  currentBid: Number,
  currentBidder: ObjectId,
  startTime: Date,
  duration: Number,
  bids: [{
    teamId: ObjectId,
    amount: Number,
    timestamp: Date
  }]
}
```

## Testing Checklist

- [ ] Admin can login and receive JWT token
- [ ] Protected routes redirect to login when not authenticated
- [ ] Events can be created, updated, deleted
- [ ] Events can be published/unpublished
- [ ] Players can be viewed for each event
- [ ] Teams can be viewed for each event
- [ ] WebSocket connection established on dashboard
- [ ] Auction can be started for a player
- [ ] Timer starts and counts down
- [ ] Auction can be ended (sold/unsold)
- [ ] Player updates with teamId and soldPrice
- [ ] Team budget updates correctly
- [ ] Real-time updates visible across multiple clients
- [ ] Auction can be reset
- [ ] Dashboard stats display correctly
