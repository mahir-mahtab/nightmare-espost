/**
 * Test script for event CRUD operations
 * Usage: node scripts/test-event-creation.js
 */

const API_BASE_URL = 'http://localhost:3000';

let adminToken = null;
let createdEventId = null;

async function getAdminToken() {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' }),
  });
  
  const data = await response.json();
  return data.data.token;
}

async function testCreateEvent() {
  console.log('📝 Test 1: Create Event');
  
  const eventData = {
    slug: 'test-event-2026',
    title: 'Test Event 2026',
    season: 'Spring',
    game: 'Valorant',
    mode: '5v5',
    password: 'event123',
    registrationCount: 0,
    maxSlots: 50,
    streamStartTime: '2026-05-01T10:00:00Z',
    auctionWindowSeconds: 30,
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(eventData),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.data.id) {
      createdEventId = data.data.id;
      console.log('✅ PASS: Event created successfully');
      console.log('   Event ID:', createdEventId);
      console.log('   Slug:', data.data.slug, '\n');
      return true;
    } else {
      console.log('❌ FAIL: Event creation failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testListEvents() {
  console.log('📋 Test 2: List Events');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/events`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log('✅ PASS: Events listed successfully');
      console.log('   Total events:', data.data.length, '\n');
      return true;
    } else {
      console.log('❌ FAIL: Events listing failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testGetEvent() {
  console.log('🔍 Test 3: Get Event by ID');
  
  if (!createdEventId) {
    console.log('⚠️  SKIP: No event ID available\n');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/events/${createdEventId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.data.id === createdEventId) {
      console.log('✅ PASS: Event retrieved successfully');
      console.log('   Title:', data.data.title);
      console.log('   Status:', data.data.status, '\n');
      return true;
    } else {
      console.log('❌ FAIL: Event retrieval failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testUpdateEvent() {
  console.log('✏️  Test 4: Update Event');
  
  if (!createdEventId) {
    console.log('⚠️  SKIP: No event ID available\n');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/events/${createdEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Test Event 2026 - Updated',
        maxSlots: 100,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.data.title.includes('Updated')) {
      console.log('✅ PASS: Event updated successfully');
      console.log('   New title:', data.data.title);
      console.log('   New maxSlots:', data.data.maxSlots, '\n');
      return true;
    } else {
      console.log('❌ FAIL: Event update failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testDeleteEvent() {
  console.log('🗑️  Test 5: Delete Event');
  
  if (!createdEventId) {
    console.log('⚠️  SKIP: No event ID available\n');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/events/${createdEventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ PASS: Event deleted successfully\n');
      return true;
    } else {
      console.log('❌ FAIL: Event deletion failed');
      console.log('   Response:', data, '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Event CRUD Tests...\n');
  
  try {
    // Get admin token
    console.log('Getting admin token...');
    adminToken = await getAdminToken();
    console.log('✓ Admin token obtained\n');
    
    // Run tests sequentially
    await testCreateEvent();
    await testListEvents();
    await testGetEvent();
    await testUpdateEvent();
    await testDeleteEvent();
    
    console.log('Event CRUD tests completed!');
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

runTests();
