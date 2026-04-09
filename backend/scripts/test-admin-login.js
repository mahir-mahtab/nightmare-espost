/**
 * Test script for admin login
 * Usage: node scripts/test-admin-login.js
 */

const API_BASE_URL = 'http://localhost:3000';

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login...\n');

  try {
    // Test 1: Valid admin login
    console.log('Test 1: Valid admin password');
    const validResponse = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'admin123' }),
    });
    
    const validData = await validResponse.json();
    
    if (validResponse.ok && validData.success && validData.data.token) {
      console.log('✅ PASS: Admin login successful');
      console.log('   Token:', validData.data.token.substring(0, 20) + '...\n');
      
      // Store token for other tests
      return validData.data.token;
    } else {
      console.log('❌ FAIL: Admin login failed');
      console.log('   Response:', validData);
      return null;
    }
  } catch (error) {
    console.log('❌ ERROR: Test 1 failed');
    console.log('   Error:', error.message);
  }

  try {
    // Test 2: Invalid admin password
    console.log('Test 2: Invalid admin password');
    const invalidResponse = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrongpassword' }),
    });
    
    const invalidData = await invalidResponse.json();
    
    if (invalidResponse.status === 401 && !invalidData.success) {
      console.log('✅ PASS: Invalid password correctly rejected\n');
    } else {
      console.log('❌ FAIL: Invalid password should be rejected');
      console.log('   Response:', invalidData, '\n');
    }
  } catch (error) {
    console.log('❌ ERROR: Test 2 failed');
    console.log('   Error:', error.message, '\n');
  }

  try {
    // Test 3: Missing password
    console.log('Test 3: Missing password');
    const missingResponse = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    const missingData = await missingResponse.json();
    
    if (missingResponse.status === 400 && !missingData.success) {
      console.log('✅ PASS: Missing password correctly rejected\n');
    } else {
      console.log('❌ FAIL: Missing password should be rejected');
      console.log('   Response:', missingData, '\n');
    }
  } catch (error) {
    console.log('❌ ERROR: Test 3 failed');
    console.log('   Error:', error.message, '\n');
  }
}

// Run test
testAdminLogin().then(() => {
  console.log('Admin login tests completed!');
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
