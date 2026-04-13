/**
 * Test script for auction logic (Phase 7/8/9)
 * Usage: node scripts/test-auction-logic.js
 */

const API_BASE_URL = 'http://localhost:3000';

let adminToken = null;
let eventId = null;
let eventSlug = null;
let ownerId = null;
let ownerSessionToken = null;
let lotId = null;

async function getAdminToken() {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' }),
  });
  const data = await response.json();
  return data.data.token;
}

async function setupAuctionData() {
  const eventRes = await fetch(`${API_BASE_URL}/api/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      slug: `auction-test-${Date.now()}`,
      title: 'Auction Logic Test Event',
      game: 'PUBG Mobile',
      password: 'event123',
      maxSlots: 16,
      registrationCount: 8,
      auctionWindowSeconds: 10,
    }),
  });
  const eventData = await eventRes.json();
  eventId = eventData.data.id;
  eventSlug = eventData.data.slug;

  const ownerRes = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}/owners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify([{ name: 'Owner Auction', password: 'owner-auction-123', avatarUrl: 'https://i.pravatar.cc/150?u=auction' }]),
  });
  const ownerData = await ownerRes.json();
  ownerId = ownerData.data[0].id;

  await fetch(`${API_BASE_URL}/api/admin/events/${eventId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify([{ name: 'Auction Team', ownerId, coinsLeft: 5000 }]),
  });

  await fetch(`${API_BASE_URL}/api/admin/events/${eventId}/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify([{ name: 'Auction Player', role: 'IGL', rankPoint: 90, basePrice: 1000 }]),
  });

  const loginRes = await fetch(`${API_BASE_URL}/api/events/${eventSlug}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password: 'event123',
      role: 'owner',
      ownerId,
      ownerPassword: 'owner-auction-123',
    }),
  });
  const loginData = await loginRes.json();
  ownerSessionToken = loginData.data.sessionToken;

  const boardRes = await fetch(`${API_BASE_URL}/api/events/${eventId}/auction`, {
    headers: { Authorization: `Bearer ${ownerSessionToken}` },
  });
  const boardData = await boardRes.json();
  lotId = boardData.data.lots[0].id;
}

async function testStartAuction() {
  const response = await fetch(`${API_BASE_URL}/api/auction/${eventId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ autoProgress: true }),
  });
  const data = await response.json();
  const ok = response.ok && data.success && data.data.isRunning;
  console.log(ok ? '✅ PASS: start auction' : '❌ FAIL: start auction', data.message || '');
  return ok;
}

async function testPlaceBid() {
  const response = await fetch(`${API_BASE_URL}/api/auction/${eventId}/bid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerSessionToken}`,
    },
    body: JSON.stringify({ lotId, amount: 1200 }),
  });
  const data = await response.json();
  const ok = response.ok && data.success && data.data.lot.currentBid === 1200;
  console.log(ok ? '✅ PASS: place bid' : '❌ FAIL: place bid', data.message || '');
  return ok;
}

async function testManualNextLot() {
  const response = await fetch(`${API_BASE_URL}/api/auction/${eventId}/next-lot`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await response.json();
  const ok = response.ok && data.success;
  console.log(ok ? '✅ PASS: next lot' : '❌ FAIL: next lot', data.message || '');
  return ok;
}

async function testStopAuction() {
  const response = await fetch(`${API_BASE_URL}/api/auction/${eventId}/stop`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await response.json();
  const ok = response.ok && data.success && !data.data.isRunning;
  console.log(ok ? '✅ PASS: stop auction' : '❌ FAIL: stop auction', data.message || '');
  return ok;
}

async function cleanup() {
  if (!eventId) return;
  await fetch(`${API_BASE_URL}/api/admin/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
}

async function run() {
  const results = [];
  try {
    adminToken = await getAdminToken();
    await setupAuctionData();

    results.push(await testStartAuction());
    results.push(await testPlaceBid());
    results.push(await testManualNextLot());
    results.push(await testStopAuction());

    const passed = results.filter(Boolean).length;
    const failed = results.length - passed;
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

run();
