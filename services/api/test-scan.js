const { NextRequest } = require('next/server');
const { getServerSession } = require('next-auth');
const { POST: triggerScan } = require('./src/app/api/alerts/scan/route');

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession;

// Mock session data
const mockSession = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
  },
};

// Helper function to create mock request
function createMockRequest(method, body) {
  const url = new URL('http://localhost:3003/api/alerts/scan');

  return {
    method,
    json: jest.fn().mockResolvedValue(body || {}),
    url: url.toString(),
    nextUrl: url,
  };
}

async function testScanTrigger() {
  try {
    console.log('Testing manual scan trigger...');

    // Mock authenticated session
    mockGetServerSession.mockResolvedValue(mockSession);

    // Create mock request
    const request = createMockRequest('POST', {});

    // Call the scan trigger function
    const response = await triggerScan(request);
    const responseData = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(responseData, null, 2));

    if (response.status === 200) {
      console.log('✅ Scan triggered successfully!');
    } else {
      console.log('❌ Scan trigger failed');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testScanTrigger();
