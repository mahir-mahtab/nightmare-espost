/**
 * Populate one auction-ready event for manual testing.
 *
 * Usage:
 *   node scripts/populate-auction-event.js
 *
 * Requires backend server running on http://localhost:3000
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DEFAULT_PLAYER_BASE_PRICE = 1000;

const toOwnerName = (index) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `Owner ${letters[index % 26]}`;
};
const toOwnerEmail = (index, suffix) => `owner${String(index + 1).padStart(2, '0')}.${suffix}@example.com`;
const toTeamName = (index) => `Franchise ${String(index + 1).padStart(2, '0')}`;

const ROLES = ['IGL', 'Assaulter', 'Support', 'Sniper', 'Rusher'];

const buildPlayers = (count = 28) => {
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 'Karen', 'Liam', 'Mila', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Sam', 'Tessa', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  return Array.from({ length: count }, (_item, index) => ({
    name: `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`,
    role: ROLES[index % ROLES.length],
    rankPoint: 60 + (index % 41),
    basePrice: DEFAULT_PLAYER_BASE_PRICE,
  }));
};

const toPlayerEmail = (index, suffix) => `player${String(index + 1).padStart(2, '0')}.${suffix}@example.com`;

const request = async (path, { method = 'GET', body, token } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`API Error at ${method} ${path}:`, {
      status: response.status,
      message: payload.message,
      errors: payload.errors,
      body: body,
    });
    throw new Error(payload.message || `Request failed: ${path}`);
  }

  return payload.data;
};

async function run() {
  const suffix = Date.now();
  const eventPassword = `event${String(suffix).slice(-6)}`;
  const eventSlug = `manual-auction-${suffix}`;

  const adminLogin = await request('/api/admin/login', {
    method: 'POST',
    body: { password: ADMIN_PASSWORD },
  });
  const adminToken = adminLogin.token;

  const event = await request('/api/admin/events', {
    method: 'POST',
    token: adminToken,
    body: {
      slug: eventSlug,
      title: 'Manual Auction Test Event',
      season: 'S1',
      game: 'PUBG Mobile',
      mode: 'Squad',
      password: eventPassword,
      registrationCount: 14,
      maxSlots: 14,
      auctionWindowSeconds: 20,
    },
  });

  // Create owners + teams through event signup flow so each request includes event password.
  for (let index = 0; index < 14; index += 1) {
    await request(`/api/events/${event.id}/signup/owner`, {
      method: 'POST',
      body: {
        eventPassword,
        ownerName: toOwnerName(index),
        ownerEmail: toOwnerEmail(index, suffix),
        ownerPassword: `owner${String(index + 1).padStart(2, '0')}123`,
        teamName: toTeamName(index),
        coinsLeft: 25000,
      },
    });
  }

  const playersPayload = buildPlayers(30);

  // Create players through event signup flow so each request includes event password.
  for (const [index, player] of playersPayload.entries()) {
    await request(`/api/events/${event.id}/signup/player`, {
      method: 'POST',
      body: {
        eventPassword,
        playerName: player.name,
        playerEmail: toPlayerEmail(index, suffix),
        playerRole: player.role,
        rankPoint: player.rankPoint,
        basePrice: player.basePrice,
      },
    });
  }

  console.log('✅ Auction test event created successfully');
  console.log(`Event ID: ${event.id}`);
  console.log(`Event Slug: ${event.slug}`);
  console.log(`Event Password: ${eventPassword}`);
  console.log(`Default Player Base Price: ${DEFAULT_PLAYER_BASE_PRICE}`);
  console.log('Owners created: 14');
  console.log('Players created: 30');
  console.log('Teams created: 14');
  console.log(`Open in UI: http://localhost:5173/events/login/${event.slug}`);
}

run().catch((error) => {
  console.error('❌ Populate failed:', error.message);
  process.exit(1);
});
