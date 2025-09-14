// Automated API Testing
// Run with: node tests/api-test.js

const API_BASE_URL = 'https://poor-jokes-newtab-ch83a79yv-mayanks-projects-72f678fa.vercel.app/api';

class APITester {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      this.failed++;
    }
  }

  async run() {
    console.log('🚀 Starting API Tests...\n');

    // Test 1: Get jokes
    await this.test('GET /api/jokes', async () => {
      const response = await fetch(`${API_BASE_URL}/jokes`);
      const data = await response.json();
      
      if (!data.success) throw new Error('Expected success: true');
      if (!Array.isArray(data.jokes)) throw new Error('Expected jokes array');
      if (data.jokes.length === 0) throw new Error('Expected at least one joke');
    });

    // Test 2: Submit joke with valid parameters
    await this.test('POST /api/jokes - Valid submission', async () => {
      const response = await fetch(`${API_BASE_URL}/jokes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Test joke for API validation',
          submitted_by: 'test-user'
        })
      });
      const data = await response.json();
      
      if (!data.success) throw new Error(`Expected success: true, got: ${data.error}`);
      if (!data.submission_id) throw new Error('Expected submission_id');
    });

    // Test 3: Submit joke with invalid parameters (should fail)
    await this.test('POST /api/jokes - Invalid parameters', async () => {
      const response = await fetch(`${API_BASE_URL}/jokes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required 'content' parameter
          submitted_by: 'test-user'
        })
      });
      const data = await response.json();
      
      if (data.success) throw new Error('Expected validation error for missing content');
      if (!data.details) throw new Error('Expected validation details');
    });

    // Test 4: Rate joke with valid parameters
    await this.test('POST /api/rate - Valid rating', async () => {
      // First get a joke to rate
      const jokesResponse = await fetch(`${API_BASE_URL}/jokes`);
      const jokesData = await jokesResponse.json();
      const jokeId = jokesData.jokes[0].id;

      const response = await fetch(`${API_BASE_URL}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joke_id: jokeId,
          user_id: 'test-user-123',
          rating: 1
        })
      });
      const data = await response.json();
      
      if (!data.success) throw new Error(`Expected success: true, got: ${data.error}`);
      if (!data.action) throw new Error('Expected action field');
    });

    // Test 5: Rate joke with invalid parameters (should fail)
    await this.test('POST /api/rate - Invalid rating', async () => {
      const response = await fetch(`${API_BASE_URL}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joke_id: 'invalid-uuid',
          user_id: 'test-user',
          rating: 2 // Invalid rating (should be 1 or -1)
        })
      });
      const data = await response.json();
      
      if (data.success) throw new Error('Expected validation error for invalid rating');
    });

    // Test 6: Get submissions
    await this.test('GET /api/submissions', async () => {
      const response = await fetch(`${API_BASE_URL}/submissions?status=pending`);
      const data = await response.json();
      
      if (!data.success) throw new Error(`Expected success: true, got: ${data.error}`);
      if (!Array.isArray(data.submissions)) throw new Error('Expected submissions array');
    });

    // Test 7: Review submission with invalid parameters (should fail)
    await this.test('POST /api/submissions - Invalid parameters', async () => {
      const response = await fetch(`${API_BASE_URL}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: 'invalid-uuid', // Wrong parameter name
          action: 'approve'
        })
      });
      const data = await response.json();
      
      if (data.success) throw new Error('Expected validation error for wrong parameter name');
    });

    // Test 8: Review submission with correct parameters
    await this.test('POST /api/submissions - Valid parameters', async () => {
      // First get a submission to review
      const submissionsResponse = await fetch(`${API_BASE_URL}/submissions?status=pending`);
      const submissionsData = await submissionsResponse.json();
      
      if (submissionsData.submissions.length > 0) {
        const submissionId = submissionsData.submissions[0].id;
        
        const response = await fetch(`${API_BASE_URL}/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: submissionId, // Correct parameter name
            action: 'approve',
            reviewed_by: 'test-admin'
          })
        });
        const data = await response.json();
        
        if (!data.success) throw new Error(`Expected success: true, got: ${data.error}`);
      } else {
        console.log('⚠️  No pending submissions to test review');
      }
    });

    // Print results
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester();
  tester.run().catch(console.error);
}

module.exports = APITester;
