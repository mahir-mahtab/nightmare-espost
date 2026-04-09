# Testing Guide - Phases 1-4

## Prerequisites

1. Docker Desktop is running
2. Backend dependencies installed (`pnpm install` in backend/)
3. Frontend dependencies installed (`npm install` in root)

---

## Step-by-Step Testing

### 1. Start Backend Services

```bash
cd backend

# Start Docker containers
docker-compose up -d

# Wait 15 seconds for PostgreSQL to initialize

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Start backend server
pnpm dev
```

**Expected output:**
```
✅ Redis connected
🚀 Redis ready
🚀 Server running on port 3000
📝 Environment: development
🌐 CORS origin: http://localhost:5173
```

**Verify:**
- Visit http://localhost:3000/health
- Should see: `{"success":true,"message":"Server is running","timestamp":"..."}`

---

### 2. Start Frontend

```bash
# In root directory
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 3. Test Admin Login

1. Navigate to: **http://localhost:5173/admin/login**
2. Enter password: `admin123`
3. Click "Login"

**Expected:**
- Should redirect to `/admin/dashboard`
- Dashboard shows "No Events Yet" if empty

**If it fails:**
- Check backend is running
- Check browser console for errors
- Verify CORS_ORIGIN in backend/.env

---

### 4. Create First Event

1. Click "Create Event" button
2. Fill in the form:
   - **Slug**: `test-event-1` (lowercase, no spaces)
   - **Title**: `Test Tournament 2026`
   - **Game**: `PUBG Mobile`
   - **Password**: `event123`
   - **Season**: `Season 1`
   - **Mode**: `Squad TPP`
   - **Max Slots**: `64`
   - **Registrations**: `50`
3. Click "Create Event"

**Expected:**
- Modal closes
- Event card appears in dashboard
- Shows event title, game, and counts (all 0 initially)

**Verify in database:**
```bash
cd backend
pnpm db:studio
```
- Navigate to "Event" table
- Should see your event listed

---

### 5. Upload Owners (Bulk)

1. Click the **Upload icon** (↑) on the event card
2. Select "owners" tab
3. Copy this JSON:

```json
[
  {
    "name": "Shakib",
    "avatarUrl": "https://images.unsplash.com/photo-1615109398623-88346a601842?w=200&h=200&fit=crop"
  },
  {
    "name": "Rafi",
    "avatarUrl": "https://images.unsplash.com/photo-1628890920690-9e29d001f7f6?w=200&h=200&fit=crop"
  },
  {
    "name": "Mishu",
    "avatarUrl": "https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=200&h=200&fit=crop"
  }
]
```

4. Paste into "JSON Data" textarea
5. Click "Upload"

**Expected:**
- Success message: "Successfully uploaded 3 owners!"
- Event card now shows "Owners: 3"

**Get Owner UUIDs:**
- Open Prisma Studio: `pnpm db:studio` (in backend/)
- Go to "Owner" table
- Copy the `id` values (UUIDs) - you'll need these for teams!

---

### 6. Upload Teams (Bulk)

1. In the same upload modal, switch to "teams" tab
2. **IMPORTANT**: Replace `OWNER_UUID_HERE` with actual UUIDs from step 5
3. Copy and modify this JSON:

```json
[
  {
    "name": "KongKaaL Gaming",
    "ownerId": "PASTE_SHAKIB_UUID_HERE",
    "coinsLeft": 5000
  },
  {
    "name": "Ghost Vortex",
    "ownerId": "PASTE_RAFI_UUID_HERE",
    "coinsLeft": 5000
  },
  {
    "name": "Neon Falcons",
    "ownerId": "PASTE_MISHU_UUID_HERE",
    "coinsLeft": 5000
  }
]
```

4. Paste into textarea
5. Click "Upload"

**Expected:**
- Success message: "Successfully uploaded 3 teams!"
- Event card now shows "Teams: 3"

---

### 7. Upload Players (Bulk)

1. Switch to "players" tab
2. Copy this JSON:

```json
[
  {
    "name": "Mallik",
    "role": "IGL",
    "rankPoint": 92,
    "basePrice": 1000,
    "imageUrl": "https://images.unsplash.com/photo-1508341591423-4347099e1f19?w=500&h=600&fit=crop"
  },
  {
    "name": "Rex",
    "role": "Assaulter",
    "rankPoint": 89,
    "basePrice": 950,
    "imageUrl": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&h=600&fit=crop"
  },
  {
    "name": "Fury",
    "role": "Support",
    "rankPoint": 87,
    "basePrice": 900,
    "imageUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&h=600&fit=crop"
  },
  {
    "name": "Ayon",
    "role": "Sniper",
    "rankPoint": 84,
    "basePrice": 850,
    "imageUrl": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=600&fit=crop"
  }
]
```

3. Paste and click "Upload"

**Expected:**
- Success message: "Successfully uploaded 4 players!"
- Event card shows "Players: 4"

**Bonus - Verify Auction Lots Created:**
- Open Prisma Studio
- Go to "AuctionLot" table
- Should see 4 lots (one for each player)
- Each lot has `status = PENDING`, `currentBid = basePrice`

---

### 8. Test Event Data APIs

**Get Event Summary:**
```bash
# First, get an event session token
curl -X POST http://localhost:3000/api/events/EVENT_ID_HERE/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "event123",
    "displayName": "Test User",
    "role": "viewer"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "YOUR_SESSION_TOKEN"
  }
}
```

**Use token to get event data:**
```bash
curl http://localhost:3000/api/events/EVENT_ID_HERE/summary \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

### 9. Test Delete Event

1. Click the **Trash icon** on an event card
2. Confirm deletion in the popup

**Expected:**
- Event card disappears
- Event deleted from database (cascade deletes teams, players, lots, owners)

---

### 10. Test Logout

1. Click "Logout" button in dashboard
2. Should redirect to `/admin/login`
3. Try accessing `/admin/dashboard` directly
4. Should redirect back to login (token cleared)

---

## Common Issues & Solutions

### Issue: "Failed to fetch events"
**Solution:**
- Check backend is running on port 3000
- Check `admin-token` exists in localStorage (browser DevTools)
- Try logging in again

### Issue: "Invalid JSON format"
**Solution:**
- Validate JSON at https://jsonlint.com
- Check for missing commas or quotes
- Ensure owner UUIDs are correct format

### Issue: "Event with this slug already exists"
**Solution:**
- Use a different slug
- Or delete the existing event first

### Issue: "CORS error"
**Solution:**
- Verify backend `.env` has `CORS_ORIGIN=http://localhost:5173`
- Restart backend server

### Issue: "Database connection failed"
**Solution:**
```bash
cd backend
docker-compose down
docker-compose up -d
# Wait 15 seconds
pnpm db:push
pnpm dev
```

---

## Success Criteria ✅

You've successfully tested Phases 1-4 if:

- ✅ Backend starts without errors
- ✅ Frontend loads admin dashboard
- ✅ Can login with admin password
- ✅ Can create events via UI
- ✅ Can bulk upload owners (JSON)
- ✅ Can bulk upload teams (JSON)
- ✅ Can bulk upload players (JSON)
- ✅ Players auto-create auction lots
- ✅ Event stats update in real-time
- ✅ Can delete events
- ✅ Can logout and re-login
- ✅ Event APIs return correct data

---

## Next Steps

Once all tests pass, you're ready for:

**Phase 5**: Event Authentication
- Public event login
- Session validation
- Role-based access

**Phase 6**: Auction Bidding
- Place bid endpoint
- Bid validation (team coins, current bid)
- Update lot status

**Phase 7**: Real-time Updates
- Socket.io integration
- Live bid broadcasting
- Timer synchronization

---

Need help debugging? Check:
1. Browser console (F12)
2. Backend logs in `backend/logs/all.log`
3. Network tab in browser DevTools
4. Prisma Studio for database state
