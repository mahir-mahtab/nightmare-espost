# Quick Reference Card

## 🚀 Start Everything

```bash
# Terminal 1: Start Docker + Backend
cd backend
docker-compose up -d
pnpm dev

# Terminal 2: Start Frontend
npm run dev
```

## 🔗 URLs

- **Frontend**: http://localhost:5173
- **Admin Login**: http://localhost:5173/admin/login
- **Admin Dashboard**: http://localhost:5173/admin/dashboard
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Prisma Studio**: Run `pnpm db:studio` in backend/

## 🔑 Default Credentials

- **Admin Password**: `admin123` (change in `backend/.env`)
- **Event Password**: Set when creating event (e.g., `event123`)

## 📝 Bulk Upload Order

1. **Owners** → Get UUIDs from Prisma Studio
2. **Teams** → Use owner UUIDs in JSON
3. **Players** → Auto-creates auction lots

## 🐛 Quick Debug

```bash
# View logs
tail -f backend/logs/all.log

# Check Docker
docker-compose ps

# Restart Docker
docker-compose down && docker-compose up -d

# Reset database
cd backend
pnpm db:push

# View database
pnpm db:studio
```

## 📊 API Test (curl)

```bash
# Admin login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'

# Create event
curl -X POST http://localhost:3000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "slug": "test-1",
    "title": "Test Event",
    "game": "PUBG Mobile",
    "password": "event123"
  }'
```

## 🎨 Frontend Routes

- `/` - Landing page
- `/admin/login` - Admin login
- `/admin/dashboard` - Event management
- `/events` - Events hub
- `/events/login/:eventId` - Event login
- `/events/:eventId/:tab` - Event page (protected)

## 📦 Backend Structure

```
backend/src/
├── config/         # env, database, redis
├── controllers/    # request handlers
├── middleware/     # auth, errors
├── routes/         # API routes
├── services/       # business logic
└── utils/          # validators, logger
```

## 🔧 Common Commands

```bash
# Backend
cd backend
pnpm dev              # Start dev server
pnpm build            # Build TypeScript
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to DB
pnpm db:studio        # Open Prisma Studio
pnpm db:migrate       # Create migration

# Frontend
npm run dev           # Start dev server
npm run build         # Build for production
npm run lint          # Run ESLint
```

## 📋 Phases Completed

- ✅ Phase 1: Project Setup
- ✅ Phase 2: Core Infrastructure  
- ✅ Phase 3: Admin Authentication
- ✅ Phase 4: Event Management + Frontend

## 🎯 Next Phases

- ⏳ Phase 5: Event Authentication
- ⏳ Phase 6: Auction Bidding
- ⏳ Phase 7: Socket.io Real-time
- ⏳ Phase 8: Admin Auction Control
