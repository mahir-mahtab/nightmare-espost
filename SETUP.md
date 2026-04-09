# Esports Event Auction System - Setup Guide

Complete implementation of Phases 1-4: Backend API + Admin Dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm installed
- Docker Desktop running (for PostgreSQL and Redis)

### 1. Start Database Services

```bash
cd backend
docker-compose up -d
```

Wait for PostgreSQL and Redis to be healthy (check with `docker-compose ps`)

### 2. Setup Backend

```bash
cd backend

# Install dependencies (if not already done)
pnpm install

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Start backend server
pnpm dev
```

Backend runs on **http://localhost:3000**

### 3. Start Frontend

```bash
# In root directory
npm run dev
```

Frontend runs on **http://localhost:5173**

### 4. Access Admin Dashboard

1. Navigate to **http://localhost:5173/admin/login**
2. Enter password: `admin123` (from .env file)
3. You'll be redirected to the admin dashboard

---

## 📋 What's Implemented

### ✅ Phase 1: Project Setup
- Backend folder structure created
- TypeScript configuration
- Docker Compose for PostgreSQL + Redis
- Prisma schema with all models
- Environment configuration

### ✅ Phase 2: Core Infrastructure
- Express server with CORS
- Prisma client singleton
- Redis client with auto-reconnect
- Winston logger
- Global error handler
- Request validation with Zod

### ✅ Phase 3: Admin Authentication
- JWT-based admin authentication
- Simple password auth (env variable)
- Admin middleware protection
- Token generation and verification

### ✅ Phase 4: Admin Event Management
- Create/Read/Update/Delete events
- Bulk upload teams (JSON)
- Bulk upload owners (JSON)
- Bulk upload players (JSON - auto-creates auction lots)
- Full validation on all endpoints

### ✅ Frontend Admin Dashboard
- Admin login page
- Event management dashboard
- Create event modal
- Bulk data upload modal (Owners/Teams/Players)
- Event listing with stats
- Delete events

---

## 🔑 API Endpoints

### Admin Authentication
```bash
POST /api/admin/login
Body: { "password": "admin123" }
Response: { "success": true, "data": { "token": "JWT_TOKEN" } }
```

### Event Management

**Create Event:**
```bash
POST /api/admin/events
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "slug": "test-event",
  "title": "Test Tournament",
  "game": "PUBG Mobile",
  "password": "event123",
  "season": "Season 1",
  "mode": "Squad TPP",
  "maxSlots": 64,
  "registrationCount": 50
}
```

**List Events:**
```bash
GET /api/admin/events
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

**Update Event:**
```bash
PUT /api/admin/events/:eventId
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: { "title": "Updated Title" }
```

**Delete Event:**
```bash
DELETE /api/admin/events/:eventId
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Bulk Data Upload

**Upload Owners:**
```bash
POST /api/admin/events/:eventId/owners
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: [
  { "name": "Owner1", "avatarUrl": "https://..." },
  { "name": "Owner2", "avatarUrl": "https://..." }
]
```

**Upload Teams:**
```bash
POST /api/admin/events/:eventId/teams
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: [
  { "name": "Team Alpha", "ownerId": "uuid-here", "coinsLeft": 5000 }
]
```

**Upload Players:**
```bash
POST /api/admin/events/:eventId/players
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: [
  {
    "name": "Player1",
    "role": "IGL",
    "rankPoint": 95,
    "basePrice": 1000,
    "imageUrl": "https://..."
  }
]
```

---

## 🎨 Frontend Admin Dashboard Features

### Login Page (`/admin/login`)
- Simple password authentication
- Error handling
- Auto-redirect to dashboard on success

### Dashboard (`/admin/dashboard`)
- **Event Cards**: Display all events with stats (teams, players, owners count)
- **Create Event**: Modal form to create new events
- **Bulk Upload**: Upload owners, teams, and players via JSON
- **Delete Events**: One-click delete with confirmation
- **Status Badges**: Visual indicators for event status (UPCOMING/LIVE/COMPLETED)
- **Logout**: Clear session and return to login

---

## 📊 Database Schema

```
Events
├── id, slug (unique), title, game, password
├── season, mode, maxSlots, registrationCount
├── status (UPCOMING/LIVE/COMPLETED)
└── Relations: teams[], players[], owners[], auctionLots[]

Teams
├── id, name, coinsLeft
├── eventId → Event
├── ownerId → Owner
└── Relations: players[], owner

Owners
├── id, name, avatarUrl
├── eventId → Event
└── Relations: teams[], auctionLots[]

Players
├── id, name, role, rankPoint, basePrice, imageUrl
├── status (ACTIVE/SOLD/UNSOLD)
├── soldToTeamId → Team (nullable)
├── finalPrice (nullable)
└── Relations: event, soldToTeam, auctionLots[]

AuctionLots
├── id, currentBid, timeLeft, lotOrder
├── status (PENDING/ACTIVE/SOLD/UNSOLD)
├── playerId → Player
├── currentOwnerId → Owner (nullable)
└── Relations: event, player, currentOwner
```

---

## 🔧 Troubleshooting

### Backend won't start
1. Check Docker containers: `docker-compose ps`
2. Verify DATABASE_URL in `.env`
3. Run Prisma migrations: `pnpm db:push`

### Can't login to admin
- Check `ADMIN_PASSWORD` in `backend/.env` (default: `admin123`)
- Ensure backend is running on port 3000

### CORS errors
- Verify `CORS_ORIGIN=http://localhost:5173` in backend `.env`
- Check frontend is running on port 5173

### Database connection failed
```bash
# Restart Docker containers
cd backend
docker-compose down
docker-compose up -d

# Wait 10 seconds, then:
pnpm db:push
```

---

## 📝 Example Workflow

1. **Start services** (Docker, Backend, Frontend)
2. **Login to admin** at `/admin/login`
3. **Create an event** with slug `test-event-1`
4. **Upload owners first** (you'll need their UUIDs for teams)
5. **Copy owner UUIDs** from browser console or Prisma Studio
6. **Upload teams** with correct `ownerId` references
7. **Upload players** (auction lots are auto-created)
8. Event is ready for public access!

---

## 🎯 Next Steps (Phase 5+)

- [ ] Event login/authentication endpoints
- [ ] Public event data APIs
- [ ] Auction bidding logic
- [ ] Socket.io real-time updates
- [ ] Timer synchronization
- [ ] Redis caching for live bids

---

## 📚 Tech Stack

**Backend:**
- Express.js + TypeScript
- Prisma ORM
- PostgreSQL (Docker)
- Redis (Docker)
- JWT Authentication
- Zod Validation
- Winston Logging

**Frontend:**
- React 19
- React Router
- Framer Motion
- Tailwind CSS
- Lucide Icons

---

## 🔐 Default Credentials

**Admin Dashboard:**
- Password: `admin123` (change in `backend/.env`)

**Event Access:**
- Password: Set when creating event
- Example: `event123`

---

Need help? Check backend logs in `backend/logs/` or run `pnpm db:studio` to inspect database directly!
