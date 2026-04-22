/**
 * Test script for bulk upload (teams, owners, players)
 * Usage: node scripts/test-bulk-upload.js
 */

const API_BASE_URL = 'http://localhost:3000';

let adminToken = null;
let testEventId = null;
let ownerIds = [];

async function getAdminToken() {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' }),
  });
  
  const data = await response.json();
  return data.data.token;
}

async function createTestEvent() {
  console.log('Creating test event...');
  
  const eventData = {
    slug: 'bulk-test-event',
    title: 'Bulk Upload Test Event',
    season: 'Spring 2026',
    game: 'Valorant',
    mode: '5v5',
    password: 'test123',
    registrationCount: 0,
    maxSlots: 50,
    auctionWindowSeconds: 30,
  };
  
  const response = await fetch(`${API_BASE_URL}/api/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(eventData),
  });
  
  const data = await response.json();
  testEventId = data.data.id;
  console.log('✓ Test event created:', testEventId, '\n');
}

async function testBulkUploadOwners() {
  console.log('👥 Test 1: Bulk Upload Owners');
  
  const ownersData = [
    { name: 'Owner Alpha', email: 'owner.alpha.bulk@example.com', password: 'owner-alpha-123', avatarUrl: 'https://i.pravatar.cc/150?u=alpha' },
    { name: 'Owner Beta', email: 'owner.beta.bulk@example.com', password: 'owner-beta-123', avatarUrl: 'https://i.pravatar.cc/150?u=beta' },
    { name: 'Owner Gamma', email: 'owner.gamma.bulk@example.com', password: 'owner-gamma-123', avatarUrl: 'https://i.pravatar.cc/150?u=gamma' },
    { name: 'Owner Delta', email: 'owner.delta.bulk@example.com', password: 'owner-delta-123', avatarUrl: 'https://i.pravatar.cc/150?u=delta' },
  ];
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}/owners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(ownersData),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && Array.isArray(data.data)) {
      ownerIds = data.data.map(o => o.id);
      console.log('✅ PASS: Owners uploaded successfully');
      console.log('   Created:', data.data.length);
      console.log('   Owner IDs:', ownerIds.slice(0, 2).join(', '), '...\n');
      return true;
    } else {
      console.log('❌ FAIL: Owners upload failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testBulkUploadTeams() {
  console.log('🏆 Test 2: Bulk Upload Teams');
  
  if (ownerIds.length < 4) {
    console.log('⚠️  SKIP: Not enough owners created\n');
    return false;
  }
  
  const teamsData = [
    { name: 'Team Alpha', ownerId: ownerIds[0], coinsLeft: 10000 },
    { name: 'Team Beta', ownerId: ownerIds[1], coinsLeft: 10000 },
    { name: 'Team Gamma', ownerId: ownerIds[2], coinsLeft: 10000 },
    { name: 'Team Delta', ownerId: ownerIds[3], coinsLeft: 10000 },
  ];
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(teamsData),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log('✅ PASS: Teams uploaded successfully');
      console.log('   Created:', data.data.length);
      console.log('   Teams:', data.data.map(t => t.name).join(', '), '\n');
      return true;
    } else {
      console.log('❌ FAIL: Teams upload failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testBulkUploadPlayers() {
  console.log('⚡ Test 3: Bulk Upload Players');
  
  const playersData = [
    { name: 'Player One', email: 'player.one.bulk@example.com', role: 'IGL', rankPoint: 85, basePrice: 500, imageUrl: 'https://i.pravatar.cc/150?u=p1' },
    { name: 'Player Two', email: 'player.two.bulk@example.com', role: 'Support', rankPoint: 90, basePrice: 800, imageUrl: 'https://i.pravatar.cc/150?u=p2' },
    { name: 'Player Three', email: 'player.three.bulk@example.com', role: 'Assaulter', rankPoint: 75, basePrice: 300, imageUrl: 'https://i.pravatar.cc/150?u=p3' },
    { name: 'Player Four', email: 'player.four.bulk@example.com', role: 'Sniper', rankPoint: 80, basePrice: 600, imageUrl: 'https://i.pravatar.cc/150?u=p4' },
    { name: 'Player Five', email: 'player.five.bulk@example.com', role: 'IGL', rankPoint: 95, basePrice: 1000, imageUrl: 'https://i.pravatar.cc/150?u=p5' },
  ];
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(playersData),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.data.players && Array.isArray(data.data.players)) {
      console.log('✅ PASS: Players uploaded successfully');
      console.log('   Created:', data.data.players.length);
      console.log('   Players:', data.data.players.slice(0, 3).map(p => p.name).join(', '), '...\n');
      return true;
    } else {
      console.log('❌ FAIL: Players upload failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testGetEventData() {
  console.log('📊 Test 4: Verify Event Data');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}/full`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      const event = data.data;
      console.log('✅ PASS: Event data retrieved');
      console.log('   Teams count:', event._count?.teams || 0);
      console.log('   Owners count:', event._count?.owners || 0);
      console.log('   Players count:', event._count?.players || 0, '\n');
      return true;
    } else {
      console.log('❌ FAIL: Event data retrieval failed');
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
  console.log('🚀 Starting Bulk Upload Tests...\n');
  
  try {
    // Setup
    console.log('Setting up...');
    adminToken = await getAdminToken();
    console.log('✓ Admin token obtained');
    await createTestEvent();
    
    // Run tests
    await testBulkUploadOwners();
    await testBulkUploadTeams();
    await testBulkUploadPlayers();
    await testGetEventData();
    
    // Cleanup
    await cleanupTestEvent();
    
    console.log('Bulk upload tests completed!');
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

runTests();
