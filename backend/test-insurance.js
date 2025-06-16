const axios = require('axios');

const TEST_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
let authToken = '';

async function testInsurance() {
  try {
    // Step 1: Get authentication token
    console.log('🔑 Authenticating...');
    const nonceResponse = await axios.post('http://localhost:8001/api/auth/nonce', {
      address: TEST_ADDRESS
    });

    const { message } = nonceResponse.data.data;
    console.log('📝 Message received:', message);

    // Using test signature since we're in development mode
    const loginResponse = await axios.post('http://localhost:8001/api/auth/login', {
      address: TEST_ADDRESS,
      signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      message: message
    });

    authToken = loginResponse.data.data.token;
    console.log('✅ Authentication successful');

    // Step 2: Create insurance policy
    console.log('\n🛡️ Creating insurance policy...');
    const createPolicyResponse = await axios.post(
      'http://localhost:8001/api/insurance',
      {
        coverageAmount: '1000',
        riskThreshold: 7000,
        duration: 30
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const policy = createPolicyResponse.data.data;
    console.log('✅ Policy created:', policy);

    // Step 3: Get user policies
    console.log('\n📋 Getting user policies...');
    const policiesResponse = await axios.get(
      'http://localhost:8001/api/insurance',
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✅ User policies:', policiesResponse.data);

    // Step 4: Get insurance stats
    console.log('\n📊 Getting insurance statistics...');
    const statsResponse = await axios.get(
      'http://localhost:8001/api/insurance/stats?global=true',
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✅ Insurance stats:', statsResponse.data);

    // Step 5: Try to claim insurance
    if (policy) {
      console.log('\n💰 Attempting to claim insurance...');
      const claimResponse = await axios.post(
        `http://localhost:8001/api/insurance/${policy.id}/claim`,
        {
          reason: 'Test claim for development purposes'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      console.log('✅ Claim processed:', claimResponse.data);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

testInsurance();