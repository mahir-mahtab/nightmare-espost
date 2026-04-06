-- ============================================================================
-- Nightmare Esports - Seed Data
-- ============================================================================
-- Sample data based on frontend constants and mock data
-- Run this after schema.sql
-- ============================================================================

-- ============================================================================
-- ADMIN USERS
-- ============================================================================
-- Password: admin123 (hashed with bcrypt)
-- In production, use proper password hashing

INSERT INTO admin_users (id, username, password_hash, name, email, role, is_active) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2b$10$rIC/9p9GE3E9X3p1bYqJvebFpVJT2MzGZ.VGv8bOoL.QHWX5KbXvW', -- admin123
    'Administrator',
    'admin@nightmare-esports.com',
    'super_admin',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000002',
    'moderator',
    '$2b$10$rIC/9p9GE3E9X3p1bYqJvebFpVJT2MzGZ.VGv8bOoL.QHWX5KbXvW', -- admin123
    'Moderator',
    'mod@nightmare-esports.com',
    'moderator',
    TRUE
);

-- ============================================================================
-- ORGANIZATION SETTINGS
-- ============================================================================

INSERT INTO org_settings (
    id, name, location, focus, services, expansion, partnerships,
    facebook_url, youtube_url, discord_url, website_url
) VALUES (
    '00000000-0000-0000-0001-000000000001',
    'Nightmare Esports',
    'Bangladesh',
    'PUBG Mobile',
    '["Tournament Operations", "Team Management", "Talent Development"]',
    'Multiple game titles planned',
    'Open for sponsorships and strategic partnerships',
    'https://facebook.com/nightmareesports',
    'https://youtube.com/@nightmareesports',
    'https://discord.gg/nightmareesports',
    'https://nightmare-esports.com'
);

-- ============================================================================
-- ORGANIZATION ROSTERS (from TEAMS_DATA)
-- ============================================================================

INSERT INTO org_rosters (id, name, role, status, game, sort_order) VALUES
(
    '00000000-0000-0000-0002-000000000001',
    'Nightmare Esports',
    '1st Line-up',
    'active',
    'PUBG Mobile',
    1
),
(
    '00000000-0000-0000-0002-000000000002',
    'Nightmare Official',
    '2nd Line-up',
    'active',
    'PUBG Mobile',
    2
);

-- ============================================================================
-- ACHIEVEMENTS (from ACHIEVEMENTS_DATA)
-- ============================================================================

INSERT INTO achievements (id, rank, placement, team, tag, event, event_date, color, image_url, sort_order) VALUES
(
    '00000000-0000-0000-0003-000000000001',
    '1ST RUNNERS UP',
    '2nd Place',
    'Quadratic Esports',
    'Q4',
    'NMxERD T1 Elite League',
    '2025-06-17',
    'silver',
    '/achivement/quadratic-1strunner.png',
    1
),
(
    '00000000-0000-0000-0003-000000000002',
    '2ND RUNNERS UP',
    '3rd Place',
    'Before the Storm',
    'B4S',
    'NMxERD T1 Elite League',
    '2025-06-17',
    'bronze',
    '/achivement/b4s-2nd-runner.png',
    2
),
(
    '00000000-0000-0000-0003-000000000003',
    '3RD RUNNERS UP',
    '4th Place',
    'RIP Esports',
    'RIP',
    'NMxERD T1 Elite League',
    '2025-06-17',
    'copper',
    '/achivement/rip-3rd.png',
    3
),
(
    '00000000-0000-0000-0003-000000000004',
    '4TH RUNNERS UP',
    '5th Place',
    'Badrage Esports',
    'BRG',
    'NMxERD T1 Elite League',
    '2025-06-17',
    'steel',
    '/achivement/badrage_4th.png',
    4
);

-- ============================================================================
-- CONTENT CREATORS (from CONTENT_CREATORS)
-- ============================================================================

INSERT INTO content_creators (id, name, role, image_url, is_featured, is_active, sort_order) VALUES
(
    '00000000-0000-0000-0004-000000000001',
    'Krull Gaming',
    'Streamer',
    'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop',
    TRUE,
    TRUE,
    1
),
(
    '00000000-0000-0000-0004-000000000002',
    'Don Bhai',
    'Content Creator',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    TRUE,
    TRUE,
    2
),
(
    '00000000-0000-0000-0004-000000000003',
    'Azim Gaming',
    'Pro Player',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    TRUE,
    TRUE,
    3
),
(
    '00000000-0000-0000-0004-000000000004',
    'Gaming With Talha',
    'Entertainer',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    TRUE,
    TRUE,
    4
),
(
    '00000000-0000-0000-0004-000000000005',
    'Mr Triple R',
    'Analyst',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
    TRUE,
    TRUE,
    5
),
(
    '00000000-0000-0000-0004-000000000006',
    'Storm Player',
    'Coach',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    TRUE,
    TRUE,
    6
);

-- ============================================================================
-- EVENTS (from EVENT_SUMMARY and TOURNAMENT_DATA)
-- ============================================================================

INSERT INTO events (
    id, name, description, season, game, mode,
    start_date, end_date, registration_deadline,
    stream_start_time, banner_url,
    max_teams, max_players_per_team, registration_slots, purse_per_team, auction_duration,
    is_published, status
) VALUES
(
    '00000000-0000-0000-0005-000000000001',
    'NM x ERD Streamer Auction Cup',
    'The ultimate streamer auction event featuring top teams and players competing for glory.',
    'Season 3',
    'PUBG Mobile',
    'Squad TPP',
    '2026-06-01 00:00:00+06',
    '2026-06-15 00:00:00+06',
    '2026-05-25 23:59:59+06',
    '8:30 PM GMT+6',
    '/achivement/quadratic-1strunner.png',
    36,
    4,
    64,
    5000,
    30,
    TRUE,
    'published'
),
(
    '00000000-0000-0000-0005-000000000002',
    'NMxERD T1 Elite League',
    'Elite league tournament featuring the best teams from the region.',
    'Season 3',
    'PUBG Mobile',
    'Squad TPP',
    '2026-07-01 00:00:00+06',
    '2026-07-10 00:00:00+06',
    '2026-06-20 23:59:59+06',
    '9:00 PM GMT+6',
    NULL,
    36,
    4,
    50,
    5000,
    30,
    TRUE,
    'published'
),
(
    '00000000-0000-0000-0005-000000000003',
    'NIGHTMARE CUP 2026',
    'The biggest esports tournament of the year featuring top teams from around the world. Experience intense competition and witness gaming excellence.',
    NULL,
    'PUBG Mobile',
    'Squad TPP',
    '2026-05-01 00:00:00+00',
    '2026-05-10 00:00:00+00',
    '2026-04-20 23:59:59+00',
    '8:00 PM GMT+6',
    NULL,
    8,
    11,
    88,
    1000000,
    60,
    TRUE,
    'published'
),
(
    '00000000-0000-0000-0005-000000000004',
    'SUMMER SHOWDOWN 2026',
    'Regional tournament for emerging teams and players to showcase their skills.',
    NULL,
    'PUBG Mobile',
    'Squad TPP',
    '2026-06-15 00:00:00+00',
    '2026-06-20 00:00:00+00',
    '2026-06-01 23:59:59+00',
    '9:00 PM GMT+6',
    NULL,
    6,
    11,
    66,
    500000,
    60,
    FALSE,
    'draft'
);

-- ============================================================================
-- EVENT PRIZE STRUCTURE (from PRIZE_STRUCTURE)
-- ============================================================================

INSERT INTO event_prize_structure (event_id, rank, rewards, sort_order) VALUES
('00000000-0000-0000-0005-000000000001', 'Top 2', 'Slot in 2K Tournament Semi-Finals + Season 4 Finals', 1),
('00000000-0000-0000-0005-000000000001', 'Top 3', 'Slot in 2K Qualifier Finals', 2),
('00000000-0000-0000-0005-000000000001', 'Top 5', 'Certificates, Banners + Season 4 Quarter Finals', 3),
('00000000-0000-0000-0005-000000000002', 'Top 2', 'Slot in 2K Tournament Semi-Finals + Season 4 Finals', 1),
('00000000-0000-0000-0005-000000000002', 'Top 3', 'Slot in 2K Qualifier Finals', 2),
('00000000-0000-0000-0005-000000000002', 'Top 5', 'Certificates, Banners + Season 4 Quarter Finals', 3);

-- ============================================================================
-- EVENT INVITED TEAMS (from INVITED_TEAMS)
-- ============================================================================

INSERT INTO event_invited_teams (event_id, team_name, is_confirmed, sort_order) VALUES
('00000000-0000-0000-0005-000000000001', 'DS Demolition Crew', TRUE, 1),
('00000000-0000-0000-0005-000000000001', 'ERD Raven Claw', TRUE, 2),
('00000000-0000-0000-0005-000000000001', 'Badrage Esports', TRUE, 3),
('00000000-0000-0000-0005-000000000001', 'Nightmare Official', TRUE, 4),
('00000000-0000-0000-0005-000000000001', 'ERD Zeroday', TRUE, 5),
('00000000-0000-0000-0005-000000000001', 'T4esOutrage', FALSE, 6),
('00000000-0000-0000-0005-000000000001', 'SF71 Esports', FALSE, 7);

-- ============================================================================
-- EVENT PARTNERS (from TOURNAMENT_DATA.partners)
-- ============================================================================

INSERT INTO event_partners (event_id, name, partner_type, sort_order) VALUES
('00000000-0000-0000-0005-000000000001', 'Krafton', 'sponsor', 1),
('00000000-0000-0000-0005-000000000001', 'Tencent Games', 'sponsor', 2),
('00000000-0000-0000-0005-000000000001', 'Lightspeed & Quantum', 'partner', 3),
('00000000-0000-0000-0005-000000000001', 'United Nations Community', 'partner', 4);

-- ============================================================================
-- TEAMS (Auction Teams from TEAM_CARDS)
-- ============================================================================

INSERT INTO teams (
    id, event_id, name, owner_name, owner_avatar_url, purse, coins_left, is_active
) VALUES
(
    '00000000-0000-0000-0006-000000000001',
    '00000000-0000-0000-0005-000000000001',
    'KongKaaL Gaming',
    'Rafi',
    'https://images.unsplash.com/photo-1615109398623-88346a601842?w=200&h=200&fit=crop',
    5000,
    3200,
    TRUE
),
(
    '00000000-0000-0000-0006-000000000002',
    '00000000-0000-0000-0005-000000000001',
    'Ghost Vortex',
    'Alif',
    'https://images.unsplash.com/photo-1628890920690-9e29d001f7f6?w=200&h=200&fit=crop',
    5000,
    2900,
    TRUE
),
(
    '00000000-0000-0000-0006-000000000003',
    '00000000-0000-0000-0005-000000000001',
    'Neon Falcons',
    'Nibir',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
    5000,
    3600,
    TRUE
),
(
    '00000000-0000-0000-0006-000000000004',
    '00000000-0000-0000-0005-000000000001',
    'Raven Battalion',
    'Mishu',
    'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=200&h=200&fit=crop',
    5000,
    2500,
    TRUE
),
(
    '00000000-0000-0000-0006-000000000005',
    '00000000-0000-0000-0005-000000000001',
    'Blaze Syndicate',
    'Tonmoy',
    'https://images.unsplash.com/photo-1629747490241-624f07d70e1e?w=200&h=200&fit=crop',
    5000,
    4100,
    TRUE
),
(
    '00000000-0000-0000-0006-000000000006',
    '00000000-0000-0000-0005-000000000001',
    'Zero Gravity',
    'Piash',
    'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=200&h=200&fit=crop',
    5000,
    3050,
    TRUE
),
-- Teams for NIGHTMARE CUP 2026
(
    '00000000-0000-0000-0006-000000000007',
    '00000000-0000-0000-0005-000000000003',
    'Mumbai Warriors',
    'Raj Mehta',
    NULL,
    1000000,
    1000000,
    TRUE
),
(
    '00000000-0000-0000-0006-000000000008',
    '00000000-0000-0000-0005-000000000003',
    'Delhi Titans',
    'Priya Sharma',
    NULL,
    1000000,
    1000000,
    TRUE
),
(
    '00000000-0000-0000-0006-000000000009',
    '00000000-0000-0000-0005-000000000003',
    'Bangalore Kings',
    'Amit Patel',
    NULL,
    1000000,
    1000000,
    TRUE
),
(
    '00000000-0000-0000-0006-000000000010',
    '00000000-0000-0000-0005-000000000003',
    'Chennai Legends',
    'Sneha Kumar',
    NULL,
    1000000,
    1000000,
    TRUE
);

-- ============================================================================
-- PLAYERS (from PLAYERS_POOL)
-- ============================================================================

INSERT INTO players (
    id, event_id, name, role, original_team_name, base_price, team_id, sold_price, 
    rank_point, nm_coin, image_url, status
) VALUES
-- Players for NM x ERD Streamer Auction Cup
(
    '00000000-0000-0000-0007-000000000001',
    '00000000-0000-0000-0005-000000000001',
    'Mallik',
    'ES-P',
    'KongKaaL Gaming',
    1000,
    '00000000-0000-0000-0006-000000000001',
    1800,
    92,
    1000,
    'https://images.unsplash.com/photo-1508341591423-4347099e1f19?w=500&h=600&fit=crop',
    'sold'
),
(
    '00000000-0000-0000-0007-000000000002',
    '00000000-0000-0000-0005-000000000001',
    'Rex',
    'NES-P',
    'Ghost Vortex',
    950,
    '00000000-0000-0000-0006-000000000002',
    2100,
    89,
    950,
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&h=600&fit=crop',
    'sold'
),
(
    '00000000-0000-0000-0007-000000000003',
    '00000000-0000-0000-0005-000000000001',
    'Fury',
    'IGL',
    'Neon Falcons',
    900,
    '00000000-0000-0000-0006-000000000003',
    1400,
    87,
    900,
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&h=600&fit=crop',
    'sold'
),
(
    '00000000-0000-0000-0007-000000000004',
    '00000000-0000-0000-0005-000000000001',
    'Ayon',
    'Support',
    'Raven Battalion',
    850,
    NULL,
    NULL,
    84,
    850,
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=600&fit=crop',
    'available'
),
(
    '00000000-0000-0000-0007-000000000005',
    '00000000-0000-0000-0005-000000000001',
    'Nafi',
    'Assaulter',
    'Blaze Syndicate',
    980,
    NULL,
    NULL,
    91,
    980,
    'https://images.unsplash.com/photo-1542382257-80dedb725088?w=500&h=600&fit=crop',
    'available'
),
(
    '00000000-0000-0000-0007-000000000006',
    '00000000-0000-0000-0005-000000000001',
    'Riad',
    'Sniper',
    'Zero Gravity',
    920,
    NULL,
    NULL,
    86,
    920,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=600&fit=crop',
    'unsold'
),
(
    '00000000-0000-0000-0007-000000000007',
    '00000000-0000-0000-0005-000000000001',
    'Shuvo',
    'Support',
    'KongKaaL Gaming',
    810,
    NULL,
    NULL,
    83,
    810,
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=600&fit=crop',
    'available'
),
(
    '00000000-0000-0000-0007-000000000008',
    '00000000-0000-0000-0005-000000000001',
    'Tasfi',
    'Assaulter',
    'Ghost Vortex',
    970,
    NULL,
    NULL,
    90,
    970,
    'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=500&h=600&fit=crop',
    'available'
),
-- Players for NIGHTMARE CUP 2026
(
    '00000000-0000-0000-0007-000000000009',
    '00000000-0000-0000-0005-000000000003',
    'Virat Sharma',
    'Batsman',
    NULL,
    200000,
    NULL,
    NULL,
    92,
    0,
    NULL,
    'available'
),
(
    '00000000-0000-0000-0007-000000000010',
    '00000000-0000-0000-0005-000000000003',
    'Rohit Kumar',
    'All-Rounder',
    NULL,
    300000,
    NULL,
    NULL,
    88,
    0,
    NULL,
    'available'
),
(
    '00000000-0000-0000-0007-000000000011',
    '00000000-0000-0000-0005-000000000003',
    'MS Patel',
    'Wicket-Keeper',
    NULL,
    250000,
    NULL,
    NULL,
    90,
    0,
    NULL,
    'available'
),
(
    '00000000-0000-0000-0007-000000000012',
    '00000000-0000-0000-0005-000000000003',
    'Jasprit Singh',
    'Bowler',
    NULL,
    180000,
    NULL,
    NULL,
    87,
    0,
    NULL,
    'available'
),
(
    '00000000-0000-0000-0007-000000000013',
    '00000000-0000-0000-0005-000000000003',
    'Hardik Verma',
    'All-Rounder',
    NULL,
    280000,
    NULL,
    NULL,
    85,
    0,
    NULL,
    'available'
);

-- ============================================================================
-- AUCTION STATE INITIALIZATION
-- ============================================================================

INSERT INTO auction_state (event_id, is_active, duration, bid_increments) VALUES
('00000000-0000-0000-0005-000000000001', FALSE, 30, '[100, 500, 1000]'),
('00000000-0000-0000-0005-000000000002', FALSE, 30, '[100, 500, 1000]'),
('00000000-0000-0000-0005-000000000003', FALSE, 60, '[5000, 10000, 25000]'),
('00000000-0000-0000-0005-000000000004', FALSE, 60, '[5000, 10000, 25000]');

-- ============================================================================
-- AUCTION LOTS (sample history)
-- ============================================================================

INSERT INTO auction_lots (event_id, player_id, final_bid, winning_team_id, status, lot_number) VALUES
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000001', 1800, '00000000-0000-0000-0006-000000000001', 'sold', 1),
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000002', 2100, '00000000-0000-0000-0006-000000000002', 'sold', 2),
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000003', 1400, '00000000-0000-0000-0006-000000000003', 'sold', 3),
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000006', NULL, NULL, 'unsold', 4);

-- ============================================================================
-- SAMPLE BIDS HISTORY
-- ============================================================================

INSERT INTO bids (event_id, player_id, team_id, amount) VALUES
-- Bids for Mallik
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0006-000000000001', 1000),
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0006-000000000002', 1200),
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0006-000000000001', 1500),
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0006-000000000001', 1800),
-- Bids for Rex
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0006-000000000002', 950),
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0006-000000000003', 1100),
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0006-000000000002', 1600),
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0006-000000000002', 2100);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check admin users
-- SELECT id, username, name, role FROM admin_users;

-- Check org settings
-- SELECT * FROM org_settings;

-- Check org rosters
-- SELECT * FROM org_rosters ORDER BY sort_order;

-- Check achievements
-- SELECT * FROM achievements ORDER BY sort_order;

-- Check content creators
-- SELECT * FROM content_creators WHERE is_active = TRUE ORDER BY sort_order;

-- Check events
-- SELECT id, name, season, status, is_published FROM events;

-- Check event statistics
-- SELECT * FROM event_statistics;

-- Check teams with player counts
-- SELECT * FROM team_rosters;

-- Check dashboard stats
-- SELECT * FROM dashboard_stats;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
