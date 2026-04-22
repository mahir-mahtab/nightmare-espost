/**
 * Test script for public event APIs
 * Usage: node scripts/test-public-apis.js
 */

const API_BASE_URL = 'http://localhost:3000';

let adminToken = null;
let testEventId = null;
let testEventSlug = null;
let sessionToken = null;

async function getAdminToken() {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' }),
  });
  
  const data = await response.json();
  return data.data.token;
}

async function setupTestEvent() {
  console.log('Setting up test event with data...');
  
  // Create event
  const eventData = {
    slug: 'public-api-test',
    title: 'Public API Test Event',
    season: 'Spring 2026',
    game: 'Valorant',
    password: 'test123',
    registrationCount: 25,
    maxSlots: 50,
    streamStartTime: '2026-05-01T10:00:00Z',
    auctionWindowSeconds: 30,
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
  };
  
  const eventResponse = await fetch(`${API_BASE_URL}/api/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(eventData),
  });
  
  const eventResult = await eventResponse.json();
  testEventId = eventResult.data.id;
  testEventSlug = eventResult.data.slug;
  console.log('✓ Event created:', testEventSlug);
  
  // Create owners
  const ownersData = [
    { name: 'Team Alpha Owner', email: 'owner.alpha.public@example.com', password: 'owner-alpha-123', avatarUrl: 'https://i.pravatar.cc/150?u=alpha' },
    { name: 'Team Beta Owner', email: 'owner.beta.public@example.com', password: 'owner-beta-123', avatarUrl: 'https://i.pravatar.cc/150?u=beta' },
  ];
  
  const ownersResponse = await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}/owners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(ownersData),
  });
  
  const ownersResult = await ownersResponse.json();
  const ownerIds = ownersResult.data.map(o => o.id);
  console.log('✓ Owners created:', ownerIds.length);
  
  // Create teams
  const teamsData = [
    { name: 'Team Alpha', ownerId: ownerIds[0], coinsLeft: 10000 },
    { name: 'Team Beta', ownerId: ownerIds[1], coinsLeft: 8500 },
  ];
  
  await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(teamsData),
  });
  console.log('✓ Teams created');
  
  // Create players
  const playersData = [
    { name: 'Player One', email: 'player.one.public@example.com', role: 'IGL', rankPoint: 85, basePrice: 500 },
    { name: 'Player Two', email: 'player.two.public@example.com', role: 'Support', rankPoint: 90, basePrice: 800 },
    { name: 'Player Three', email: 'player.three.public@example.com', role: 'Assaulter', rankPoint: 75, basePrice: 300 },
  ];
  
  await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(playersData),
  });
  console.log('✓ Players created');
  
  // Get session token
  const loginResponse = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password: 'test123',
      role: 'guest',
    }),
  });
  
  const loginResult = await loginResponse.json();
  sessionToken = loginResult.data.sessionToken;
  console.log('✓ Session token obtained\n');
}

async function testGetEventSummary() {
  console.log('📊 Test 1: Get Event Summary');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/summary`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.data.title) {
      console.log('✅ PASS: Event summary retrieved');
      console.log('   Title:', data.data.title);
      console.log('   Game:', data.data.game);
      console.log('   Status:', data.data.status);
      console.log('   Total Teams:', data.data.totalTeams);
      console.log('   Total Players:', data.data.totalPlayers, '\n');
      return true;
    } else {
      console.log('❌ FAIL: Event summary retrieval failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testGetTeams() {
  console.log('🏆 Test 2: Get Teams');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/teams`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log('✅ PASS: Teams retrieved');
      console.log('   Total Teams:', data.data.length);
      if (data.data.length > 0) {
        console.log('   Sample Team:', data.data[0].name);
        console.log('   Owner:', data.data[0].owner?.name);
        console.log('   Coins Left:', data.data[0].coinsLeft);
      }
      console.log();
      return true;
    } else {
      console.log('❌ FAIL: Teams retrieval failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testGetOwners() {
  console.log('👥 Test 3: Get Owners');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/owners`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log('✅ PASS: Owners retrieved');
      console.log('   Total Owners:', data.data.length);
      if (data.data.length > 0) {
        console.log('   Sample Owner:', data.data[0].name);
        console.log('   Teams Count:', data.data[0]._count?.teams || 0);
      }
      console.log();
      return true;
    } else {
      console.log('❌ FAIL: Owners retrieval failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testGetPlayers() {
  console.log('⚡ Test 4: Get Players');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/players`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log('✅ PASS: Players retrieved');
      console.log('   Total Players:', data.data.length);
      if (data.data.length > 0) {
        console.log('   Sample Player:', data.data[0].name);
        console.log('   Role:', data.data[0].role);
        console.log('   Base Price:', data.data[0].basePrice);
        console.log('   Status:', data.data[0].status);
      }
      console.log();
      return true;
    } else {
      console.log('❌ FAIL: Players retrieval failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testGetAuctionBoard() {
  console.log('🎯 Test 5: Get Auction Board');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/auction`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ PASS: Auction board retrieved');
      console.log('   Current Lot:', data.data.currentLot || 'None');
      console.log('   Upcoming Lots:', data.data.upcomingLots?.length || 0);
      console.log('   Completed Lots:', data.data.completedLots?.length || 0, '\n');
      return true;
    } else {
      console.log('❌ FAIL: Auction board retrieval failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('🔒 Test 6: Unauthorized Access (no session token)');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/summary`);
    
    const data = await response.json();
    
    if (response.status === 401 && !data.success) {
      console.log('✅ PASS: Unauthorized access correctly rejected\n');
      return true;
    } else {
      console.log('❌ FAIL: Unauthorized access should be rejected');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function cleanupTestEvent() {
  console.log('Cleaning up test event...');
  
  try {
    await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    console.log('✓ Test event deleted\n');
  } catch (error) {
    console.log('⚠️  Cleanup failed:', error.message, '\n');
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Public Event APIs Tests...\n');
  
  try {
    // Setup
    adminToken = await getAdminToken();
    await setupTestEvent();
    
    // Run tests
    await testGetEventSummary();
    await testGetTeams();
    await testGetOwners();
    await testGetPlayers();
    await testGetAuctionBoard();
    await testUnauthorizedAccess();
    
    // Cleanup
    await cleanupTestEvent();
    
    console.log('Public event APIs tests completed!');
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

runTests();
