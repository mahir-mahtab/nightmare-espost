# Admin Dashboard - Quick Start Guide

## Login Instructions

### Development Mode (No Backend Required)

The dashboard works in **development mode** with mock data for testing the UI without a backend.

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the admin login**:
   Open your browser to: `http://localhost:5173/admin/login`

3. **Login with test credentials**:
   - **Username**: `admin`
   - **Password**: `admin123`

4. **You're in!**
   After login, you'll be redirected to `/dashboard` with full access to:
   - Event management (create, edit, delete, publish)
   - Auction manager with mock data
   - Teams overview

### Production Mode (With Backend)

Once your backend is ready:

1. **Configure environment variables**:
   Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_WS_BASE_URL=http://localhost:5000
   VITE_USE_MOCK=false
   ```

2. **Ensure backend is running**:
   - Backend should be running on port 5000 (or configured port)
   - All endpoints from `BACKEND_INTEGRATION.md` should be implemented

3. **Login with real credentials**:
   Navigate to `/admin/login` and use credentials from your database

## Features Available in Mock Mode

✅ **Working Features** (with mock data):
- Login/logout
- View events list
- Create/edit/delete events
- Publish/unpublish events
- View players and teams
- Start/end auction (simulated)
- View auction state
- Teams overview with budgets
- Dashboard statistics

⚠️ **Limited Features** (without WebSocket):
- Real-time updates (WebSocket events won't work without backend)
- Live timer sync across multiple clients
- Instant bid notifications

## Switching Between Mock and Real Backend

The system automatically uses mock data when:
- `VITE_USE_MOCK=true` in `.env`, OR
- `VITE_API_BASE_URL` is not set

To force real API usage:
```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://your-backend-url/api
```

## Testing the Dashboard

### Test Scenario 1: Event Management
1. Login with `admin/admin123`
2. Click "CREATE EVENT"
3. Fill in event details
4. Click "CREATE EVENT" button
5. Event appears in the list
6. Click "EDIT" to modify
7. Click "PUBLISH" to make it visible
8. Click "DELETE" to remove (with confirmation)

### Test Scenario 2: Auction Manager
1. Login and navigate to dashboard
2. Click "AUCTION" on any event
3. See list of available players (5 mock players)
4. Click "Play" button on a player to start auction
5. Timer starts counting down from 60s
6. Click "SOLD!" to end auction
7. Player moves to team roster (if bidder exists)
8. Switch to "TEAMS OVERVIEW" tab to see team rosters

### Test Scenario 3: Team Budget Tracking
1. Go to auction manager
2. Switch to "TEAMS OVERVIEW" tab
3. See 4 mock teams with budget information
4. Click on a team to expand and see player roster
5. Budget bars show spending vs. remaining purse

## Mock Data Contents

**Events**: 2 events
- NIGHTMARE CUP 2026 (published)
- SUMMER SHOWDOWN 2026 (draft)

**Players**: 5 players for event1
- Virat Sharma (Batsman) - ₹200,000
- Rohit Kumar (All-Rounder) - ₹300,000
- MS Patel (Wicket-Keeper) - ₹250,000
- Jasprit Singh (Bowler) - ₹180,000
- Hardik Verma (All-Rounder) - ₹280,000

**Teams**: 4 teams for event1
- Mumbai Warriors
- Delhi Titans
- Bangalore Kings
- Chennai Legends

Each team has ₹1,000,000 purse

## Troubleshooting

### Can't login?
- Make sure you're in development mode (`npm run dev`)
- Use exact credentials: `admin` / `admin123`
- Check browser console for errors

### Dashboard shows no data?
- Mock data is automatically loaded
- Check if `mockData.js` exists in `src/services/`
- Check browser console for import errors

### WebSocket errors in console?
- Normal in mock mode
- WebSocket won't connect without backend
- UI still works, just no real-time updates

### Events not saving?
- In mock mode, data is stored in memory
- Refresh = data resets to initial state
- For persistence, connect real backend

## Next Steps

Once you're ready to connect the backend:

1. Read `BACKEND_INTEGRATION.md` for API specifications
2. Implement backend endpoints
3. Set up WebSocket server
4. Configure `.env` with real backend URL
5. Test with real data

## Support

For issues or questions:
- Check `DASHBOARD_README.md` for full documentation
- Review `BACKEND_INTEGRATION.md` for API specs
- Check browser console for errors
- Verify environment variables in `.env`
