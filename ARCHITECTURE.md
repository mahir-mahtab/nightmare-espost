# System Architecture - Esports Event Auction

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                    http://localhost:5173                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Admin Login  │  │   Landing    │  │ Event Login  │         │
│  │    Page      │  │     Page     │  │    Page      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │          Admin Dashboard                          │          │
│  │  - Create Events                                  │          │
│  │  - Upload Owners/Teams/Players                    │          │
│  │  - Manage Auction                                 │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │          Event Page (Protected)                   │          │
│  │  - Overview | Teams | Players | Auction           │          │
│  │  - Live Bidding (Phase 7+)                        │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express + TypeScript)               │
│                      http://localhost:3000                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐          ┌──────────────────┐            │
│  │  Admin Routes    │          │  Event Routes    │            │
│  │  /api/admin/*    │          │  /api/events/*   │            │
│  └────────┬─────────┘          └────────┬─────────┘            │
│           │                              │                       │
│           │                              │                       │
│  ┌────────▼──────────────────────────────▼─────────┐           │
│  │           Middleware Layer                       │           │
│  │  - JWT Auth (Admin)                              │           │
│  │  - Session Auth (Event Users)                    │           │
│  │  - Error Handling                                │           │
│  │  - Request Validation (Zod)                      │           │
│  └──────────────────────┬───────────────────────────┘           │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────┐           │
│  │           Service Layer                           │           │
│  │  - authService: JWT generation/validation         │           │
│  │  - eventService: Business logic                   │           │
│  │  - auctionService: Bidding logic (Phase 6+)       │           │
│  └──────────────────────┬───────────────────────────┘           │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────┴─────────────────┐
        │                                    │
        ▼                                    ▼
┌───────────────────┐              ┌──────────────────┐
│   PostgreSQL      │              │      Redis       │
│   (Docker)        │              │    (Docker)      │
│   Port: 5432      │              │   Port: 6379     │
├───────────────────┤              ├──────────────────┤
│                   │              │                  │
│  Tables:          │              │  Cache:          │
│  - events         │              │  - Live bids     │
│  - teams          │              │  - Auction timer │
│  - owners         │              │  - Sessions      │
│  - players        │              │                  │
│  - auction_lots   │              │  (Phase 7+)      │
│  - action_logs    │              │                  │
│                   │              │                  │
└───────────────────┘              └──────────────────┘
```

## Data Flow Diagrams

### 1. Admin Creates Event

```
Admin Browser
    │
    │ 1. Enter event details
    ▼
Admin Dashboard (React)
    │
    │ 2. POST /api/admin/events
    │    Headers: Bearer TOKEN
    ▼
Express Server
    │
    │ 3. Verify admin JWT
    ▼
Admin Middleware
    │
    │ 4. Validate payload
    ▼
Zod Validation
    │
    │ 5. Create event
    ▼
Event Service
    │
    │ 6. INSERT INTO events
    ▼
PostgreSQL
    │
    │ 7. Return event object
    ▼
Admin Dashboard
    │
    │ 8. Display new event card
    ▼
Admin sees event
```

### 2. Admin Uploads Players

```
Admin Browser
    │
    │ 1. Paste JSON array
    ▼
Bulk Upload Modal
    │
    │ 2. POST /api/admin/events/:id/players
    ▼
Express Server
    │
    │ 3. Validate JSON array
    ▼
Event Service
    │
    │ 4. Transaction START
    │    - Create players
    │    - Create auction lots (for each player)
    │    Transaction COMMIT
    ▼
PostgreSQL
    │
    │ 5. Return created players + lots
    ▼
Admin Dashboard
    │
    │ 6. Show success message
    ▼
Players ready for auction
```

### 3. User Joins Event (Phase 5)

```
User Browser
    │
    │ 1. Enter event password + display name
    ▼
Event Login Page
    │
    │ 2. POST /api/events/:id/auth/login
    ▼
Express Server
    │
    │ 3. Verify event password
    ▼
Event Service
    │
    │ 4. Generate session JWT
    ▼
Auth Service
    │
    │ 5. Return token + session data
    ▼
Event Login Page
    │
    │ 6. Store token in localStorage
    │    Navigate to /events/:id/auction
    ▼
Event Page (Protected)
    │
    │ 7. All requests include Bearer token
    ▼
User can view/bid in event
```

### 4. Live Bidding Flow (Phase 7 - Future)

```
Owner Browser
    │
    │ 1. Click bid button
    ▼
Auction Hub Component
    │
    │ 2. Socket.emit('place_bid')
    ▼
Socket.io Server
    │
    │ 3. Validate bid
    │    - Team has coins?
    │    - Bid > current?
    │    - Lot active?
    ▼
Auction Service
    │
    │ 4. Save to Redis (temp)
    ▼
Redis Cache
    │
    │ 5. Broadcast to all clients
    │    Socket.broadcast('new_bid')
    ▼
All Connected Clients
    │
    │ 6. Update UI in real-time
    ▼
Everyone sees new bid instantly
```

## Authentication Flow

### Admin Authentication

```
┌─────────────────┐
│  Admin Login    │
│  Password input │
└────────┬────────┘
         │
         │ POST /api/admin/login
         ▼
┌─────────────────────────┐
│  Backend validates      │
│  password === env var   │
└────────┬────────────────┘
         │
         │ Generate JWT
         ▼
┌─────────────────────────┐
│  JWT Payload:           │
│  {                      │
│    role: "admin",       │
│    timestamp: 123456    │
│  }                      │
│  Expires: 8 hours       │
└────────┬────────────────┘
         │
         │ Return token
         ▼
┌─────────────────────────┐
│  Store in localStorage  │
│  Key: "admin-token"     │
└─────────────────────────┘
         │
         │ All admin requests
         ▼
┌─────────────────────────┐
│  Headers:               │
│  Authorization:         │
│    Bearer TOKEN         │
└─────────────────────────┘
```

### Event Session Authentication

```
┌─────────────────┐
│  Event Login    │
│  - password     │
│  - displayName  │
│  - role         │
│  - ownerId      │
└────────┬────────┘
         │
         │ POST /api/events/:id/auth/login
         ▼
┌─────────────────────────┐
│  Backend validates      │
│  event password         │
└────────┬────────────────┘
         │
         │ Generate JWT
         ▼
┌─────────────────────────┐
│  JWT Payload:           │
│  {                      │
│    eventId: "uuid",     │
│    displayName: "User", │
│    role: "owner",       │
│    ownerId: "uuid"      │
│  }                      │
│  Expires: 8 hours       │
└────────┬────────────────┘
         │
         │ Return token
         ▼
┌─────────────────────────┐
│  Store in localStorage  │
│  Use for all requests   │
└─────────────────────────┘
```

## Database Relationships

```
┌──────────┐
│  Event   │
│  (Main)  │
└────┬─────┘
     │
     │ 1:N
     ├────────────┬────────────┬────────────┬────────────┐
     │            │            │            │            │
     ▼            ▼            ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ Team   │  │ Owner  │  │ Player │  │Auction │  │Action  │
│        │  │        │  │        │  │  Lot   │  │  Log   │
└────┬───┘  └───┬────┘  └───┬────┘  └───┬────┘  └────────┘
     │          │           │           │
     │          │           │           │
     │ N:1      │ N:1       │ 1:N       │ N:1
     └──────────┴───────────┴───────────┘
     
     Team.ownerId → Owner.id
     Player.soldToTeamId → Team.id (nullable)
     AuctionLot.playerId → Player.id
     AuctionLot.currentOwnerId → Owner.id (nullable)
```

## Technology Stack

```
┌─────────────────────────────────────────┐
│           Frontend Layer                 │
├─────────────────────────────────────────┤
│  React 19                                │
│  React Router                            │
│  Tailwind CSS                            │
│  Framer Motion                           │
│  Lucide Icons                            │
└─────────────────────────────────────────┘
                  │
                  │ REST API / WebSocket
                  ▼
┌─────────────────────────────────────────┐
│           Backend Layer                  │
├─────────────────────────────────────────┤
│  Express.js                              │
│  TypeScript                              │
│  Socket.io (Phase 7+)                    │
│  JWT (jsonwebtoken)                      │
│  Zod (validation)                        │
│  Winston (logging)                       │
└─────────────────────────────────────────┘
                  │
                  │ ORM
                  ▼
┌─────────────────────────────────────────┐
│           Data Layer                     │
├─────────────────────────────────────────┤
│  Prisma ORM                              │
│  PostgreSQL 16                           │
│  Redis 7                                 │
└─────────────────────────────────────────┘
                  │
                  │ Container
                  ▼
┌─────────────────────────────────────────┐
│      Infrastructure Layer                │
├─────────────────────────────────────────┤
│  Docker Compose                          │
│  - postgres:16-alpine                    │
│  - redis:7-alpine                        │
└─────────────────────────────────────────┘
```

---

This architecture supports:
- ✅ Multi-event system
- ✅ Real-time auction updates (Phase 7+)
- ✅ Role-based access control
- ✅ Scalable bidding system
- ✅ Audit logging
- ✅ Session management
