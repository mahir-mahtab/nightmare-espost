-- ============================================================================
-- Nightmare Esports - Complete Database Schema
-- ============================================================================
-- PostgreSQL Schema for Esports Platform
-- Created: 2026-04-02
-- Database: PostgreSQL 14+
-- ============================================================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: admin_users
-- Purpose: Store admin credentials and info
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'admin', -- 'super_admin', 'admin', 'moderator'
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT admin_users_username_check CHECK (LENGTH(username) >= 3),
    CONSTRAINT admin_users_role_check CHECK (role IN ('super_admin', 'admin', 'moderator'))
);

-- Index for admin_users
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

-- ============================================================================
-- TABLE: org_settings
-- Purpose: Store organization settings (singleton)
-- ============================================================================
CREATE TABLE IF NOT EXISTS org_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Nightmare Esports',
    location VARCHAR(255) DEFAULT 'Bangladesh',
    focus VARCHAR(255) DEFAULT 'PUBG Mobile',
    services JSONB DEFAULT '["Tournament Operations", "Team Management", "Talent Development"]',
    expansion TEXT,
    partnerships TEXT,
    
    -- Social Links
    facebook_url TEXT,
    youtube_url TEXT,
    discord_url TEXT,
    website_url TEXT,
    twitter_url TEXT,
    instagram_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: org_rosters
-- Purpose: Store organization's team rosters/lineups
-- ============================================================================
CREATE TABLE IF NOT EXISTS org_rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100), -- '1st Line-up', '2nd Line-up', etc.
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'disbanded'
    game VARCHAR(100) NOT NULL,
    logo_url TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT org_rosters_status_check CHECK (status IN ('active', 'inactive', 'disbanded'))
);

CREATE INDEX idx_org_rosters_status ON org_rosters(status);
CREATE INDEX idx_org_rosters_game ON org_rosters(game);

-- ============================================================================
-- TABLE: achievements
-- Purpose: Store achievements/awards won by teams
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rank VARCHAR(100) NOT NULL, -- '1ST RUNNERS UP', 'CHAMPION', etc.
    placement VARCHAR(50) NOT NULL, -- '1st Place', '2nd Place', etc.
    team VARCHAR(255) NOT NULL,
    tag VARCHAR(50), -- Team tag like 'Q4', 'B4S'
    event VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    color VARCHAR(50) DEFAULT 'primary', -- 'gold', 'silver', 'bronze', 'primary'
    image_url TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT achievements_color_check CHECK (color IN ('gold', 'silver', 'bronze', 'copper', 'steel', 'primary'))
);

CREATE INDEX idx_achievements_event ON achievements(event);
CREATE INDEX idx_achievements_date ON achievements(event_date DESC);
CREATE INDEX idx_achievements_team ON achievements(team);

-- ============================================================================
-- TABLE: content_creators
-- Purpose: Store content creator/streamer information
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL, -- 'Streamer', 'Content Creator', 'Pro Player', 'Entertainer', 'Analyst', 'Coach'
    image_url TEXT,
    bio TEXT,
    
    -- Social Links
    youtube_url TEXT,
    twitch_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT content_creators_role_check CHECK (role IN ('Streamer', 'Content Creator', 'Pro Player', 'Entertainer', 'Analyst', 'Coach'))
);

CREATE INDEX idx_content_creators_is_featured ON content_creators(is_featured);
CREATE INDEX idx_content_creators_is_active ON content_creators(is_active);
CREATE INDEX idx_content_creators_role ON content_creators(role);

-- ============================================================================
-- TABLE: events
-- Purpose: Store esports tournament/event information
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    season VARCHAR(100),
    game VARCHAR(100) DEFAULT 'PUBG Mobile',
    mode VARCHAR(100), -- 'Squad TPP', 'Squad FPP', etc.
    
    -- Dates
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Location & Stream
    location VARCHAR(255),
    stream_start_time VARCHAR(100),
    stream_url TEXT,
    banner_url TEXT,
    
    -- Configuration
    max_teams INTEGER NOT NULL DEFAULT 8,
    max_players_per_team INTEGER NOT NULL DEFAULT 4,
    registration_slots INTEGER DEFAULT 50,
    purse_per_team BIGINT NOT NULL DEFAULT 5000,
    auction_duration INTEGER DEFAULT 30, -- seconds per player
    
    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'registration', 'ongoing', 'completed', 'cancelled'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT events_name_check CHECK (LENGTH(name) >= 3),
    CONSTRAINT events_dates_check CHECK (end_date > start_date),
    CONSTRAINT events_max_teams_check CHECK (max_teams >= 2 AND max_teams <= 64),
    CONSTRAINT events_max_players_check CHECK (max_players_per_team >= 1 AND max_players_per_team <= 25),
    CONSTRAINT events_purse_check CHECK (purse_per_team >= 100),
    CONSTRAINT events_status_check CHECK (status IN ('draft', 'published', 'registration', 'ongoing', 'completed', 'cancelled'))
);

CREATE INDEX idx_events_is_published ON events(is_published);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_game ON events(game);
CREATE INDEX idx_events_name_search ON events USING gin(to_tsvector('english', name));

-- ============================================================================
-- TABLE: event_prize_structure
-- Purpose: Store prize structure for events
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_prize_structure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    rank VARCHAR(100) NOT NULL, -- 'Top 2', 'Top 3', etc.
    rewards TEXT NOT NULL,
    prize_amount BIGINT DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT event_prize_structure_unique UNIQUE (event_id, rank)
);

CREATE INDEX idx_event_prize_structure_event ON event_prize_structure(event_id);

-- ============================================================================
-- TABLE: event_invited_teams
-- Purpose: Store invited teams for events
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_invited_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    is_confirmed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT event_invited_teams_unique UNIQUE (event_id, team_name)
);

CREATE INDEX idx_event_invited_teams_event ON event_invited_teams(event_id);

-- ============================================================================
-- TABLE: event_partners
-- Purpose: Store partners/sponsors for events
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    partner_type VARCHAR(50) DEFAULT 'sponsor', -- 'sponsor', 'partner', 'media'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT event_partners_type_check CHECK (partner_type IN ('sponsor', 'partner', 'media'))
);

CREATE INDEX idx_event_partners_event ON event_partners(event_id);

-- ============================================================================
-- TABLE: teams (Auction Teams)
-- Purpose: Store team information for each event's auction
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    
    -- Owner Info
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255),
    owner_phone VARCHAR(50),
    owner_avatar_url TEXT,
    owner_password_hash VARCHAR(255), -- For owner login during auction
    
    -- Financial
    purse BIGINT NOT NULL,
    coins_left BIGINT NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT teams_name_check CHECK (LENGTH(name) >= 2),
    CONSTRAINT teams_owner_name_check CHECK (LENGTH(owner_name) >= 2),
    CONSTRAINT teams_purse_check CHECK (purse >= 0),
    CONSTRAINT teams_coins_left_check CHECK (coins_left >= 0 AND coins_left <= purse),
    CONSTRAINT teams_unique_name_per_event UNIQUE (event_id, name)
);

CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_teams_is_active ON teams(is_active);
CREATE INDEX idx_teams_owner_email ON teams(owner_email);

-- ============================================================================
-- TABLE: players
-- Purpose: Store player information for each event's auction
-- ============================================================================
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100), -- 'ES-P', 'NES-P', 'IGL', 'Support', 'Assaulter', 'Sniper'
    
    -- Original Team (before auction)
    original_team_name VARCHAR(255),
    
    -- Auction Details
    base_price BIGINT NOT NULL DEFAULT 500,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    sold_price BIGINT,
    
    -- Player Stats
    rank_point INTEGER DEFAULT 0,
    nm_coin INTEGER DEFAULT 0, -- Base value/currency
    stats JSONB DEFAULT '{}',
    
    -- Additional Info
    image_url TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'sold', 'unsold', 'withdrawn'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT players_name_check CHECK (LENGTH(name) >= 2),
    CONSTRAINT players_base_price_check CHECK (base_price >= 0),
    CONSTRAINT players_sold_price_check CHECK (sold_price IS NULL OR sold_price >= base_price),
    CONSTRAINT players_status_check CHECK (status IN ('available', 'sold', 'unsold', 'withdrawn')),
    CONSTRAINT players_role_check CHECK (role IS NULL OR role IN ('ES-P', 'NES-P', 'IGL', 'Support', 'Assaulter', 'Sniper', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'))
);

CREATE INDEX idx_players_event_id ON players(event_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_players_role ON players(role);
CREATE INDEX idx_players_name_search ON players USING gin(to_tsvector('english', name));

-- ============================================================================
-- TABLE: auction_state
-- Purpose: Store current auction state for each event (real-time data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS auction_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Current Auction
    is_active BOOLEAN DEFAULT FALSE,
    current_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    current_bid BIGINT,
    current_bidder_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Timing
    start_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER DEFAULT 30, -- Duration in seconds
    
    -- Configuration
    bid_increments JSONB DEFAULT '[100, 500, 1000]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT auction_state_duration_check CHECK (duration > 0 AND duration <= 300),
    CONSTRAINT auction_state_bid_check CHECK (current_bid IS NULL OR current_bid > 0)
);

CREATE INDEX idx_auction_state_event_id ON auction_state(event_id);
CREATE INDEX idx_auction_state_is_active ON auction_state(is_active);
CREATE INDEX idx_auction_state_current_player ON auction_state(current_player_id);

-- ============================================================================
-- TABLE: bids
-- Purpose: Store bid history for auctions
-- ============================================================================
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT bids_amount_check CHECK (amount > 0)
);

CREATE INDEX idx_bids_event_id ON bids(event_id);
CREATE INDEX idx_bids_player_id ON bids(player_id);
CREATE INDEX idx_bids_team_id ON bids(team_id);
CREATE INDEX idx_bids_created_at ON bids(created_at DESC);

-- ============================================================================
-- TABLE: auction_lots
-- Purpose: Store auction lot history (all players that went through auction)
-- ============================================================================
CREATE TABLE IF NOT EXISTS auction_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Result
    final_bid BIGINT,
    winning_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'sold', 'unsold'
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Order
    lot_number INTEGER NOT NULL,
    
    CONSTRAINT auction_lots_status_check CHECK (status IN ('pending', 'active', 'sold', 'unsold')),
    CONSTRAINT auction_lots_unique UNIQUE (event_id, player_id)
);

CREATE INDEX idx_auction_lots_event ON auction_lots(event_id);
CREATE INDEX idx_auction_lots_status ON auction_lots(status);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: event_statistics
CREATE OR REPLACE VIEW event_statistics AS
SELECT 
    e.id AS event_id,
    e.name AS event_name,
    e.status,
    e.is_published,
    COUNT(DISTINCT t.id) AS team_count,
    COUNT(DISTINCT p.id) AS player_count,
    COUNT(DISTINCT CASE WHEN p.status = 'sold' THEN p.id END) AS sold_player_count,
    COUNT(DISTINCT CASE WHEN p.status = 'available' THEN p.id END) AS available_player_count,
    COALESCE(SUM(CASE WHEN p.status = 'sold' THEN p.sold_price ELSE 0 END), 0) AS total_sold_value,
    AVG(CASE WHEN p.status = 'sold' THEN p.sold_price END) AS avg_sold_price
FROM events e
LEFT JOIN teams t ON e.id = t.event_id
LEFT JOIN players p ON e.id = p.event_id
GROUP BY e.id, e.name, e.status, e.is_published;

-- View: team_rosters
CREATE OR REPLACE VIEW team_rosters AS
SELECT 
    t.id AS team_id,
    t.event_id,
    t.name AS team_name,
    t.owner_name,
    t.purse,
    t.coins_left,
    COUNT(p.id) AS player_count,
    COALESCE(SUM(p.sold_price), 0) AS total_spent,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'role', p.role,
            'sold_price', p.sold_price,
            'image_url', p.image_url
        ) ORDER BY p.sold_price DESC NULLS LAST
    ) FILTER (WHERE p.id IS NOT NULL) AS players
FROM teams t
LEFT JOIN players p ON t.id = p.team_id AND p.status = 'sold'
GROUP BY t.id, t.event_id, t.name, t.owner_name, t.purse, t.coins_left;

-- View: active_auctions
CREATE OR REPLACE VIEW active_auctions AS
SELECT 
    a.id AS auction_id,
    a.event_id,
    e.name AS event_name,
    a.is_active,
    a.current_player_id,
    p.name AS player_name,
    p.role AS player_role,
    p.base_price AS player_base_price,
    p.image_url AS player_image,
    a.current_bid,
    a.current_bidder_id,
    t.name AS current_bidder_name,
    a.start_time,
    a.duration,
    a.bid_increments,
    EXTRACT(EPOCH FROM (a.start_time + (a.duration || ' seconds')::INTERVAL - NOW())) AS time_remaining
FROM auction_state a
JOIN events e ON a.event_id = e.id
LEFT JOIN players p ON a.current_player_id = p.id
LEFT JOIN teams t ON a.current_bidder_id = t.id
WHERE a.is_active = TRUE;

-- View: dashboard_stats
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM events) AS total_events,
    (SELECT COUNT(*) FROM events WHERE is_published = TRUE AND status IN ('published', 'registration', 'ongoing')) AS active_events,
    (SELECT COUNT(*) FROM players) AS total_players,
    (SELECT COUNT(*) FROM teams) AS total_teams,
    (SELECT COUNT(*) FROM content_creators WHERE is_active = TRUE) AS total_creators,
    (SELECT COUNT(*) FROM achievements) AS total_achievements;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: update_team_coins_left
CREATE OR REPLACE FUNCTION update_team_coins_left()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.team_id IS NOT NULL AND NEW.sold_price IS NOT NULL THEN
        UPDATE teams
        SET coins_left = purse - (
            SELECT COALESCE(SUM(sold_price), 0)
            FROM players
            WHERE team_id = NEW.team_id AND status = 'sold'
        )
        WHERE id = NEW.team_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: validate_team_budget
CREATE OR REPLACE FUNCTION validate_team_budget()
RETURNS TRIGGER AS $$
DECLARE
    team_coins_available BIGINT;
BEGIN
    SELECT coins_left INTO team_coins_available
    FROM teams
    WHERE id = NEW.team_id;
    
    IF team_coins_available < NEW.amount THEN
        RAISE EXCEPTION 'Team does not have enough budget. Available: %, Required: %', 
            team_coins_available, NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on various tables
CREATE TRIGGER trigger_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_org_settings_updated_at
    BEFORE UPDATE ON org_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_org_rosters_updated_at
    BEFORE UPDATE ON org_rosters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_content_creators_updated_at
    BEFORE UPDATE ON content_creators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_auction_state_updated_at
    BEFORE UPDATE ON auction_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update team coins after player sale
CREATE TRIGGER trigger_update_team_coins
    AFTER INSERT OR UPDATE OF team_id, sold_price ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_team_coins_left();

-- Trigger: Validate team budget before bid
CREATE TRIGGER trigger_validate_team_budget
    BEFORE INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION validate_team_budget();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE admin_users IS 'Admin users for dashboard access';
COMMENT ON TABLE org_settings IS 'Organization settings (singleton table)';
COMMENT ON TABLE org_rosters IS 'Organization team lineups/rosters';
COMMENT ON TABLE achievements IS 'Achievement records for teams';
COMMENT ON TABLE content_creators IS 'Content creators and streamers';
COMMENT ON TABLE events IS 'Esports events/tournaments';
COMMENT ON TABLE teams IS 'Teams participating in event auctions';
COMMENT ON TABLE players IS 'Players available for auction';
COMMENT ON TABLE auction_state IS 'Current state of auction for each event';
COMMENT ON TABLE bids IS 'Historical record of all bids placed';
COMMENT ON TABLE auction_lots IS 'Auction lot history for all players';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
