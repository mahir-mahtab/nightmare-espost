# Esports Event Auction Backend

Backend API server for the esports event auction system built with Express, PostgreSQL, Redis, and Socket.io (TypeScript).

## Quick Start

### 1. Start Docker Containers

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis containers.

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

### 4. Run Prisma Migrations

```bash
pnpm db:generate
pnpm db:push
```

### 5. Start Development Server

```bash
pnpm dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### Admin Routes (`/api/admin`)

**Authentication:**
- `POST /api/admin/login` - Admin login (returns JWT token)

**Event Management:**
- `POST /api/admin/events` - Create event
- `GET /api/admin/events` - List all events
- `GET /api/admin/events/:eventId` - Get event details
- `PUT /api/admin/events/:eventId` - Update event
- `DELETE /api/admin/events/:eventId` - Delete event

**Bulk Data Upload:**
- `POST /api/admin/events/:eventId/teams` - Create teams (bulk)
- `POST /api/admin/events/:eventId/owners` - Create owners (bulk)
- `POST /api/admin/events/:eventId/players` - Create players (bulk)

### Public Event Routes (`/api/events`)

**Authentication:**
- `POST /api/events/:eventId/auth/login` - Login to event (per-event password)
- `POST /api/events/:eventId/auth/validate` - Validate session token
- `POST /api/events/:eventId/auth/logout` - Logout

**Event Data:**
- `GET /api/events/:eventId/summary` - Get event summary
- `GET /api/events/:eventId/teams` - Get teams
- `GET /api/events/:eventId/owners` - Get owners
- `GET /api/events/:eventId/players` - Get players (with filters)
- `GET /api/events/:eventId/auction` - Get auction board state

## Example Requests

### Admin Login

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password": "admin123"}'
```

### Create Event

```bash
curl -X POST http://localhost:3000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "slug": "test-event-1",
    "title": "Test Tournament",
    "game": "PUBG Mobile",
    "password": "event123",
    "maxSlots": 64
  }'
```

### Event Login

```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "event123",
    "displayName": "John Doe",
    "role": "viewer"
  }'
```

## Bulk Data Upload Format

### Teams (JSON Array)

```json
[
  {
    "name": "Team Alpha",
    "ownerId": "owner-uuid-here",
    "coinsLeft": 5000
  }
]
```

### Owners (JSON Array)

```json
[
  {
    "name": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
]
```

### Players (JSON Array)

```json
[
  {
    "name": "Player1",
    "role": "IGL",
    "rankPoint": 95,
    "basePrice": 1000,
    "imageUrl": "https://example.com/player.jpg"
  }
]
```

## Database Management

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (dev)
pnpm db:push

# Create migration
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

## Project Structure

```
backend/
├── src/
│   ├── config/         # Database, Redis, env config
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, error handling
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Helpers, validators, logger
│   └── index.ts        # Express server
├── prisma/
│   └── schema.prisma   # Database schema
├── docker-compose.yml  # PostgreSQL + Redis
└── package.json
```

## Technologies

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Redis** - Caching
- **Socket.io** - WebSocket (Phase 5+)
- **JWT** - Authentication
- **Winston** - Logging
- **Zod** - Validation
