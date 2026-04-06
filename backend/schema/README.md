# Database Schema for Event Management System

## Overview

This directory contains PostgreSQL database schema for the Event Management & Auction platform. The schema focuses exclusively on **event-related functionality**: events, teams, players, and auction management.

## Files

- **`schema.sql`** - Complete database schema with tables, indexes, views, functions, and triggers
- **`seed.sql`** - Sample data for testing and development

## Database Structure

### Tables

#### 1. **events**
Stores tournament/event information
- Event details (name, description, dates, location)
- Configuration (max teams, max players per team, purse per team)
- Status (draft, published, ongoing, completed, cancelled)

#### 2. **teams**
Stores teams participating in events
- Team information (name, owner details)
- Financial tracking (purse, coins left)
- Links to event via `event_id`

#### 3. **players**
Stores players available for auction
- Player information (name, role, stats)
- Auction details (base price, sold price, team assignment)
- Status (available, sold, unsold, withdrawn)
- Links to event and optionally to team

#### 4. **auction_state**
Stores current real-time auction state for each event
- Active auction status
- Current player being auctioned
- Current bid and bidder
- Auction timing (start time, duration)

#### 5. **bids**
Historical record of all bids placed
- Tracks which team bid on which player
- Bid amount and timestamp
- Links to event, player, and team

### Views

#### **event_statistics**
Aggregated statistics for each event:
- Team count, player count
- Sold/available player counts
- Total sold value, average sold price

#### **team_rosters**
Team composition with player details:
- Team information
- Player count and total spent
- JSON array of players with details

#### **active_auctions**
Currently active auctions with full details:
- Event and player information
- Current bid and bidder
- Time remaining calculation

### Functions & Triggers

#### Auto-update Triggers
- **`update_updated_at_column()`** - Automatically updates `updated_at` timestamp on record changes
- Applied to: `events`, `teams`, `players`, `auction_state`

#### Business Logic Triggers
- **`update_team_coins_left()`** - Automatically recalculates team's remaining budget when player is sold
- **`validate_team_budget()`** - Ensures team has enough budget before allowing a bid

## Setup Instructions

### Prerequisites
- PostgreSQL 14 or higher
- `uuid-ossp` extension
- Database created (default name: `esports`)

### Installation

1. **Create database** (if not exists):
```bash
createdb esports
```

2. **Run schema** (creates tables, views, functions, triggers):
```bash
psql -d esports -f schema/schema.sql
```

3. **Load seed data** (optional, for testing):
```bash
psql -d esports -f schema/seed.sql
```

### Verification

Check if tables were created:
```sql
\dt
```

Check views:
```sql
\dv
```

Check sample data:
```sql
SELECT * FROM events;
SELECT * FROM event_statistics;
```

## Usage Examples

### Create a New Event
```sql
INSERT INTO events (
    name,
    description,
    start_date,
    end_date,
    location,
    max_teams,
    max_players_per_team,
    purse_per_team,
    is_published
) VALUES (
    'My Tournament 2026',
    'Description here',
    '2026-07-01 00:00:00+00',
    '2026-07-10 00:00:00+00',
    'City, Country',
    8,
    11,
    1000000,
    FALSE
);
```

### Create Teams for an Event
```sql
INSERT INTO teams (event_id, name, owner_name, owner_email, purse, coins_left)
VALUES 
    ('event-uuid-here', 'Team Alpha', 'Owner Name', 'owner@email.com', 1000000, 1000000),
    ('event-uuid-here', 'Team Beta', 'Owner 2', 'owner2@email.com', 1000000, 1000000);
```

### Add Players
```sql
INSERT INTO players (event_id, name, role, base_price, stats)
VALUES 
    ('event-uuid-here', 'Player 1', 'IGL', 300000, '{"matches": 50, "rating": 90}'),
    ('event-uuid-here', 'Player 2', 'ES-P', 250000, '{"matches": 45, "rating": 85}');
```

### Start an Auction
```sql
UPDATE auction_state
SET 
    is_active = TRUE,
    current_player_id = 'player-uuid',
    current_bid = 300000,  -- base price
    start_time = NOW(),
    duration = 60
WHERE event_id = 'event-uuid';
```

### Place a Bid
```sql
-- Insert bid record
INSERT INTO bids (event_id, player_id, team_id, amount)
VALUES ('event-uuid', 'player-uuid', 'team-uuid', 350000);

-- Update auction state
UPDATE auction_state
SET 
    current_bid = 350000,
    current_bidder_id = 'team-uuid'
WHERE event_id = 'event-uuid';
```

### End Auction (Sell Player)
```sql
-- Update player
UPDATE players
SET 
    team_id = 'winning-team-uuid',
    sold_price = 350000,
    status = 'sold'
WHERE id = 'player-uuid';

-- Reset auction state
UPDATE auction_state
SET 
    is_active = FALSE,
    current_player_id = NULL,
    current_bid = NULL,
    current_bidder_id = NULL,
    start_time = NULL
WHERE event_id = 'event-uuid';

-- Team's coins_left will be automatically updated by trigger
```

### Get Event Statistics
```sql
SELECT * FROM event_statistics WHERE event_id = 'event-uuid';
```

### Get Team Rosters
```sql
SELECT * FROM team_rosters WHERE event_id = 'event-uuid';
```

### Get Active Auctions
```sql
SELECT * FROM active_auctions;
```

## Key Features

### Automatic Budget Management
The `update_team_coins_left()` trigger automatically:
- Calculates total spent by team
- Updates `coins_left` when player is sold
- Ensures accurate financial tracking

### Budget Validation
The `validate_team_budget()` trigger ensures:
- Teams cannot bid more than available budget
- Prevents over-spending
- Raises exception if budget insufficient

### Cascade Deletes
- Deleting an event automatically deletes:
  - All teams in that event
  - All players in that event
  - All bids for that event
  - Auction state for that event
- Deleting a team automatically:
  - Sets `team_id` to NULL for players owned by that team
  - Removes associated bids

### Data Integrity
- Check constraints ensure valid data
- Foreign key constraints maintain relationships
- Unique constraints prevent duplicates
- Status enums enforce valid values

## Seed Data

The `seed.sql` file includes:
- 2 sample events (Nightmare Cup 2026, Summer Showdown 2026)
- 8 teams for Nightmare Cup 2026
- 10 players for Nightmare Cup 2026
- Initialized auction states

Perfect for testing and development!

## Database Schema Diagram

```
┌─────────────┐
│   events    │
├─────────────┤
│ id (PK)     │
│ name        │
│ description │
│ dates       │
│ config      │
│ status      │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│    teams    │    │   players   │
├─────────────┤    ├─────────────┤
│ id (PK)     │◄───│ team_id (FK)│
│ event_id(FK)│    │ event_id(FK)│
│ name        │    │ name        │
│ owner_name  │    │ role        │
│ purse       │    │ base_price  │
│ coins_left  │    │ sold_price  │
└──────┬──────┘    └──────┬──────┘
       │                  │
       │                  │
       ▼                  ▼
┌──────────────────────────┐
│         bids             │
├──────────────────────────┤
│ id (PK)                  │
│ event_id (FK)            │
│ player_id (FK)           │
│ team_id (FK)             │
│ amount                   │
│ created_at               │
└──────────────────────────┘

┌──────────────────────────┐
│    auction_state         │
├──────────────────────────┤
│ id (PK)                  │
│ event_id (FK) UNIQUE     │
│ is_active                │
│ current_player_id (FK)   │
│ current_bid              │
│ current_bidder_id (FK)   │
│ start_time               │
│ duration                 │
└──────────────────────────┘
```

## Environment Variables

Configure in backend `.env`:
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=esports
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

## Maintenance

### Backup Database
```bash
pg_dump esports > backup.sql
```

### Restore Database
```bash
psql esports < backup.sql
```

### Reset Database
```bash
# WARNING: Deletes all data!
psql -d esports -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -d esports -f schema/schema.sql
psql -d esports -f schema/seed.sql
```

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE` for global compatibility
- UUIDs used for primary keys for scalability
- JSON fields (`stats`) provide flexibility for player statistics
- Views provide optimized queries for common operations
- Triggers automate business logic for data consistency

## Support

For issues or questions, refer to:
- `BACKEND_INTEGRATION.md` - API endpoint specifications
- PostgreSQL documentation: https://www.postgresql.org/docs/
