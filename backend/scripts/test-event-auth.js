/**
 * Test script for event authentication
 * Usage: node scripts/test-event-auth.js
 */

const API_BASE_URL = 'http://localhost:3000';

let adminToken = null;
let testEventId = null;
let testEventSlug = null;
let ownerSessionToken = null;
let guestSessionToken = null;
let ownerId = null;

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
    slug: 'auth-test-event',
    title: 'Auth Test Event',
    game: 'Valorant',
    password: 'eventpass123',
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
  testEventSlug = data.data.slug;
  console.log('✓ Test event created:', testEventSlug, '\n');

  const ownersResponse = await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}/owners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([
      {
        name: 'Test Owner',
        password: 'owner1234',
      },
    ]),
  });

  const ownersData = await ownersResponse.json();
  ownerId = ownersData.data[0].id;

  await fetch(`${API_BASE_URL}/api/admin/events/${testEventId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify([
      {
        name: 'Owner Team',
        ownerId,
        coinsLeft: 10000,
      },
    ]),
  });
}

async function testEventLoginAsGuest() {
  console.log('👁️  Test 1: Event Login as Guest');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'eventpass123',
        role: 'guest',
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.data.sessionToken) {
      guestSessionToken = data.data.sessionToken;
      console.log('✅ PASS: Guest login successful');
      console.log('   Display Name:', data.data.displayName);
      console.log('   Role:', data.data.role);
      console.log('   Session Token:', guestSessionToken.substring(0, 20) + '...\n');
      return true;
    } else {
      console.log('❌ FAIL: Guest login failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testEventLoginWithWrongPassword() {
  console.log('🔒 Test 2: Event Login with Wrong Password');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'wrongpassword',
        role: 'guest',
      }),
    });
    
    const data = await response.json();
    
    if (response.status === 401 && !data.success) {
      console.log('✅ PASS: Wrong password correctly rejected\n');
      return true;
    } else {
      console.log('❌ FAIL: Wrong password should be rejected');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testEventLoginAsOwner() {
  console.log('👤 Test 3: Event Login as Owner');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'eventpass123',
        role: 'owner',
        ownerId,
        ownerPassword: 'owner1234',
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.data.sessionToken) {
      ownerSessionToken = data.data.sessionToken;
      console.log('✅ PASS: Owner login successful\n');
      return true;
    } else {
      console.log('❌ FAIL: Owner login failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testVerifySession() {
  console.log('✓ Test 4: Verify Session');

  if (!guestSessionToken) {
    console.log('⚠️  SKIP: No session token available\n');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/auth/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${guestSessionToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.data.session) {
      console.log('✅ PASS: Session verified successfully');
      console.log('   Display Name:', data.data.session.displayName);
      console.log('   Role:', data.data.session.role, '\n');
      return true;
    } else {
      console.log('❌ FAIL: Session verification failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testInvalidSession() {
  console.log('❌ Test 5: Invalid Session Token');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${testEventSlug}/auth/validate`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token-here',
      },
    });
    
    const data = await response.json();
    
    if (response.status === 401 && !data.success) {
      console.log('✅ PASS: Invalid session correctly rejected\n');
      return true;
    } else {
      console.log('❌ FAIL: Invalid session should be rejected');
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
  console.log('🚀 Starting Event Authentication Tests...\n');
  
  try {
    // Setup
    console.log('Setting up...');
    adminToken = await getAdminToken();
    console.log('✓ Admin token obtained');
    await createTestEvent();
    
    // Run tests
    await testEventLoginAsGuest();
    await testEventLoginWithWrongPassword();
    await testEventLoginAsOwner();
    await testVerifySession();
    await testInvalidSession();
    
    // Cleanup
    await cleanupTestEvent();
    
    console.log('Event authentication tests completed!');
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

runTests();
