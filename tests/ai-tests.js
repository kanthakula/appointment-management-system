/**
 * AI Functionality Test Suite
 * Run with: node tests/ai-tests.js
 */

require('dotenv').config();
const fetch = require('node-fetch');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3002';
let testResults = [];
let passed = 0;
let failed = 0;

// Test helper
async function runTest(testName, testFn) {
  console.log(`\n🧪 Testing: ${testName}`);
  try {
    await testFn();
    console.log(`✅ PASSED: ${testName}`);
    testResults.push({ name: testName, status: 'PASSED' });
    passed++;
  } catch (error) {
    console.error(`❌ FAILED: ${testName}`);
    console.error(`   Error: ${error.message}`);
    testResults.push({ name: testName, status: 'FAILED', error: error.message });
    failed++;
  }
}

// Test 1: Check AI Service Configuration
async function testAIConfiguration() {
  if (!process.env.AI_PROVIDER) {
    throw new Error('AI_PROVIDER not set in environment');
  }
  
  if (process.env.AI_PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set for OpenAI provider');
  }
  
  if (process.env.AI_PROVIDER === 'ollama') {
    // Check if Ollama is running
    try {
      const response = await fetch(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/tags`);
      if (!response.ok) {
        throw new Error('Ollama server is not running');
      }
    } catch (error) {
      throw new Error(`Ollama not accessible: ${error.message}`);
    }
  }
  
  console.log(`   ✓ Using provider: ${process.env.AI_PROVIDER}`);
}

// Test 2: Smart Slot Recommendations
async function testSmartRecommendations() {
  const email = 'test@example.com';
  const response = await fetch(`${BASE_URL}/api/slots/recommendations?email=${encodeURIComponent(email)}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const data = await response.json();
  
  if (!data.hasOwnProperty('recommendations')) {
    throw new Error('Response missing "recommendations" field');
  }
  
  console.log(`   ✓ Found ${data.recommendations.length} recommendations`);
  if (data.summary) {
    console.log(`   ✓ Summary: ${data.summary.substring(0, 60)}...`);
  }
  
  if (data.recommendations.length > 0) {
    const first = data.recommendations[0];
    if (!first.id || !first.date) {
      throw new Error('Recommendation missing required fields');
    }
    console.log(`   ✓ First recommendation: ${first.date} at ${first.start}`);
    if (first.recommendationReason) {
      console.log(`   ✓ Reason: ${first.recommendationReason.substring(0, 50)}...`);
    }
  }
}

// Test 3: Natural Language Booking - Find Slots
async function testNaturalLanguageFind() {
  const response = await fetch(`${BASE_URL}/api/booking/natural-language`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Find me slots for tomorrow afternoon',
      email: 'test@example.com'
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const data = await response.json();
  
  if (!data.intent) {
    throw new Error('Response missing "intent" field');
  }
  
  if (data.intent.action !== 'find') {
    throw new Error(`Expected action "find", got "${data.intent.action}"`);
  }
  
  console.log(`   ✓ Intent parsed: ${data.intent.action}`);
  console.log(`   ✓ Found ${data.matchingSlots?.length || 0} matching slots`);
  console.log(`   ✓ Message: ${data.message}`);
}

// Test 4: Natural Language Booking - Book Intent
async function testNaturalLanguageBook() {
  const response = await fetch(`${BASE_URL}/api/booking/natural-language`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Book me for next Sunday afternoon for 3 people',
      email: 'test@example.com'
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const data = await response.json();
  
  if (!data.intent) {
    throw new Error('Response missing "intent" field');
  }
  
  if (!['book', 'find'].includes(data.intent.action)) {
    throw new Error(`Unexpected action: ${data.intent.action}`);
  }
  
  if (data.intent.partySize !== 3) {
    throw new Error(`Expected partySize 3, got ${data.intent.partySize}`);
  }
  
  console.log(`   ✓ Intent: ${data.intent.action}`);
  console.log(`   ✓ Party size: ${data.intent.partySize}`);
  console.log(`   ✓ Time preference: ${data.intent.time}`);
}

// Test 5: Natural Language Booking - Cancel Intent
async function testNaturalLanguageCancel() {
  const response = await fetch(`${BASE_URL}/api/booking/natural-language`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'I need to cancel my booking',
      email: 'test@example.com'
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const data = await response.json();
  
  if (!data.intent) {
    throw new Error('Response missing "intent" field');
  }
  
  if (data.intent.action !== 'cancel') {
    throw new Error(`Expected action "cancel", got "${data.intent.action}"`);
  }
  
  console.log(`   ✓ Intent: ${data.intent.action}`);
  console.log(`   ✓ Cancel intent recognized correctly`);
}

// Test 6: AI Email Generation - Confirmation
async function testEmailGenerationConfirmation() {
  const response = await fetch(`${BASE_URL}/api/ai/generate-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'confirmation',
      bookingData: {
        name: 'John Doe',
        date: '2025-11-10',
        time: '14:00',
        partySize: 2
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const data = await response.json();
  
  if (!data.emailContent) {
    throw new Error('Response missing "emailContent" field');
  }
  
  if (data.emailContent.length < 50) {
    throw new Error('Email content too short');
  }
  
  if (!data.emailContent.toLowerCase().includes('john')) {
    throw new Error('Email does not include booking name');
  }
  
  console.log(`   ✓ Generated ${data.emailContent.length} character email`);
  console.log(`   ✓ Type: ${data.type}`);
  console.log(`   ✓ Preview: ${data.emailContent.substring(0, 80)}...`);
}

// Test 7: AI Email Generation - Reminder
async function testEmailGenerationReminder() {
  const response = await fetch(`${BASE_URL}/api/ai/generate-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'reminder',
      bookingData: {
        name: 'Jane Smith',
        date: '2025-11-15',
        time: '10:00',
        partySize: 1
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  const data = await response.json();
  
  if (!data.emailContent) {
    throw new Error('Response missing "emailContent" field');
  }
  
  console.log(`   ✓ Reminder email generated successfully`);
}

// Test 8: Error Handling - Invalid Email
async function testErrorHandlingInvalidEmail() {
  const response = await fetch(`${BASE_URL}/api/slots/recommendations?email=invalid`);
  
  if (response.ok) {
    // Should either fail or return empty recommendations
    const data = await response.json();
    if (data.recommendations === undefined) {
      throw new Error('Should return recommendations array even for invalid email');
    }
  } else if (response.status !== 400) {
    throw new Error(`Expected 400 for invalid email, got ${response.status}`);
  }
  
  console.log(`   ✓ Error handling works for invalid email`);
}

// Test 9: Error Handling - Missing Required Fields
async function testErrorHandlingMissingFields() {
  const response = await fetch(`${BASE_URL}/api/booking/natural-language`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  
  if (response.status !== 400) {
    throw new Error(`Expected 400 for missing message, got ${response.status}`);
  }
  
  console.log(`   ✓ Error handling works for missing fields`);
}

// Test 10: Fallback Behavior
async function testFallbackBehavior() {
  // Test that system works even if AI is slow/unavailable
  const startTime = Date.now();
  const response = await fetch(`${BASE_URL}/api/slots/recommendations?email=test@example.com`);
  const duration = Date.now() - startTime;
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Should return recommendations (either AI-powered or fallback)
  if (!data.recommendations || !Array.isArray(data.recommendations)) {
    throw new Error('Should always return recommendations array');
  }
  
  console.log(`   ✓ Response time: ${duration}ms`);
  console.log(`   ✓ Fallback: ${data.fallback ? 'Yes' : 'No (AI working)'}`);
  console.log(`   ✓ Returned ${data.recommendations.length} slots`);
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting AI Functionality Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`🔧 Provider: ${process.env.AI_PROVIDER || 'Not set'}`);
  console.log('=' .repeat(60));

  // Run all tests
  await runTest('AI Configuration Check', testAIConfiguration);
  await runTest('Smart Slot Recommendations', testSmartRecommendations);
  await runTest('Natural Language - Find Slots', testNaturalLanguageFind);
  await runTest('Natural Language - Book Intent', testNaturalLanguageBook);
  await runTest('Natural Language - Cancel Intent', testNaturalLanguageCancel);
  await runTest('Email Generation - Confirmation', testEmailGenerationConfirmation);
  await runTest('Email Generation - Reminder', testEmailGenerationReminder);
  await runTest('Error Handling - Invalid Email', testErrorHandlingInvalidEmail);
  await runTest('Error Handling - Missing Fields', testErrorHandlingMissingFields);
  await runTest('Fallback Behavior', testFallbackBehavior);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total:  ${passed + failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults
      .filter(t => t.status === 'FAILED')
      .forEach(t => {
        console.log(`   - ${t.name}: ${t.error}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

