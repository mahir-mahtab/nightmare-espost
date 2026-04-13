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

const toOwnerName = (index) => `Owner ${String(index + 1).padStart(2, '0')}`;
const toTeamName = (index) => `Franchise ${String(index + 1).padStart(2, '0')}`;

const ROLES = ['IGL', 'Assaulter', 'Support', 'Sniper', 'Rusher'];

const buildPlayers = (count = 28) => {
  return Array.from({ length: count }, (_item, index) => ({
    name: `Player ${String(index + 1).padStart(2, '0')}`,
    role: ROLES[index % ROLES.length],
    rankPoint: 60 + (index % 41),
    basePrice: 800 + (index * 50),
  }));
};

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

  const ownersPayload = Array.from({ length: 14 }, (_item, index) => ({
    name: toOwnerName(index),
    password: `owner${String(index + 1).padStart(2, '0')}123`,
  }));

  const owners = await request(`/api/admin/events/${event.id}/owners`, {
    method: 'POST',
    token: adminToken,
    body: ownersPayload,
  });

  const teamsPayload = owners.map((owner, index) => ({
    name: toTeamName(index),
    ownerId: owner.id,
    coinsLeft: 25000,
  }));

  await request(`/api/admin/events/${event.id}/teams`, {
    method: 'POST',
    token: adminToken,
    body: teamsPayload,
  });

  const playersPayload = buildPlayers(30);

  await request(`/api/admin/events/${event.id}/players`, {
    method: 'POST',
    token: adminToken,
    body: playersPayload,
  });

  console.log('✅ Auction test event created successfully');
  console.log(`Event ID: ${event.id}`);
  console.log(`Event Slug: ${event.slug}`);
  console.log(`Event Password: ${eventPassword}`);
  console.log('Owners created: 14');
  console.log('Players created: 30');
  console.log('Teams created: 14');
  console.log(`Open in UI: http://localhost:5173/events/login/${event.slug}`);
}

run().catch((error) => {
  console.error('❌ Populate failed:', error.message);
  process.exit(1);
});
