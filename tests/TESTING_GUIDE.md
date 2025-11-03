# 🧪 AI Functionality Testing Guide

Complete guide for testing all AI features in DarshanFlow.

---

## 📋 Prerequisites

### 1. Environment Setup

**Option A: OpenAI (Recommended)**
```bash
# Add to .env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
AI_USAGE_LIMIT_MONTHLY=100000
```

**Option B: Ollama (Free)**
```bash
# Add to .env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434

# Install and start Ollama
# Download from: https://ollama.ai
ollama pull llama3
ollama serve
```

### 2. Server Running
```bash
npm start
# Server should be running on http://localhost:3002
```

### 3. Test Data
Ensure you have:
- At least 3 published time slots in the future
- Some booking history (optional, for better recommendations)
- At least one user registration in the database

---

## 🚀 Quick Test (Automated)

Run the automated test suite:

```bash
node tests/ai-tests.js
```

This will run 10 comprehensive tests covering all AI features.

---

## 📝 Manual Testing Steps

### Test 1: Smart Slot Recommendations

#### Step 1.1: Test with Email
```bash
curl "http://localhost:3002/api/slots/recommendations?email=test@example.com"
```

**Expected Response:**
```json
{
  "recommendations": [
    {
      "id": "slot-id",
      "date": "2025-11-10T00:00:00.000Z",
      "start": "10:00",
      "recommendationReason": "Based on your booking history...",
      "remaining": 5,
      "capacity": 10
    }
  ],
  "summary": "Recommended slots based on your preferences",
  "historyCount": 2
}
```

#### Step 1.2: Test with Existing User
Use an email that has booking history:
```bash
curl "http://localhost:3002/api/slots/recommendations?email=existing-user@example.com"
```

**Verify:**
- ✅ Returns 1-3 recommendations
- ✅ Each recommendation has `recommendationReason`
- ✅ Slots are in the future
- ✅ Slots have remaining capacity

#### Step 1.3: Test with New User
```bash
curl "http://localhost:3002/api/slots/recommendations?email=newuser@example.com"
```

**Verify:**
- ✅ Still returns recommendations (based on availability)
- ✅ Works even without booking history

#### Step 1.4: Test Error Handling
```bash
# Missing email
curl "http://localhost:3002/api/slots/recommendations"
# Should return 400 error
```

---

### Test 2: Natural Language Booking

#### Step 2.1: Find Slots - Tomorrow Afternoon
```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find me slots for tomorrow afternoon",
    "email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "intent": {
    "action": "find",
    "date": "2025-11-03",
    "time": "afternoon",
    "partySize": null,
    "urgency": "medium"
  },
  "matchingSlots": [...],
  "message": "Found 3 available slot(s) for Monday, November 3, 2025 in the afternoon",
  "canBook": true
}
```

**Verify:**
- ✅ Intent is parsed correctly
- ✅ Date is calculated (tomorrow)
- ✅ Time filter applied (afternoon)
- ✅ Matching slots returned

#### Step 2.2: Book Intent - Specific Date
```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Book me for next Sunday afternoon for 3 people",
    "email": "test@example.com"
  }'
```

**Verify:**
- ✅ Action: "book" or "find"
- ✅ Party size: 3
- ✅ Time: "afternoon"
- ✅ Date calculated correctly

#### Step 2.3: Cancel Intent
```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need to cancel my booking",
    "email": "existing-user@example.com"
  }'
```

**Verify:**
- ✅ Action: "cancel"
- ✅ Returns user's upcoming bookings (if email exists)

#### Step 2.4: Various Natural Language Inputs

Test these messages:

```bash
# Morning preference
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "Find morning slots", "email": "test@example.com"}'

# Evening preference
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me evening appointments", "email": "test@example.com"}'

# Specific time
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "Book for 2 PM tomorrow", "email": "test@example.com"}'

# Weekend
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to book this weekend", "email": "test@example.com"}'
```

#### Step 2.5: Error Handling
```bash
# Missing message
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Should return 400
```

---

### Test 3: AI Email Generation

#### Step 3.1: Confirmation Email
```bash
curl -X POST http://localhost:3002/api/ai/generate-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "confirmation",
    "bookingData": {
      "name": "John Doe",
      "date": "2025-11-10",
      "time": "14:00",
      "partySize": 2
    }
  }'
```

**Expected Response:**
```json
{
  "emailContent": "Dear John Doe,\n\nWe are delighted to confirm your appointment...",
  "type": "confirmation",
  "generatedAt": "2025-11-02T..."
}
```

**Verify:**
- ✅ Email is personalized (includes name)
- ✅ Includes date and time
- ✅ Mentions party size
- ✅ Professional and warm tone
- ✅ Length: 200-500 characters

#### Step 3.2: Reminder Email
```bash
curl -X POST http://localhost:3002/api/ai/generate-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reminder",
    "bookingData": {
      "name": "Jane Smith",
      "date": "2025-11-15",
      "time": "10:00",
      "partySize": 1
    }
  }'
```

**Verify:**
- ✅ Reminder tone
- ✅ Mentions time is 24 hours before
- ✅ Brief and helpful

#### Step 3.3: Cancellation Email
```bash
curl -X POST http://localhost:3002/api/ai/generate-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cancellation",
    "bookingData": {
      "name": "Bob Wilson",
      "date": "2025-11-12",
      "time": "16:00",
      "partySize": 3
    }
  }'
```

**Verify:**
- ✅ Confirms cancellation
- ✅ Offers rebooking option
- ✅ Courteous tone

#### Step 3.4: Waitlist Email
```bash
curl -X POST http://localhost:3002/api/ai/generate-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "waitlist",
    "bookingData": {
      "name": "Alice Brown",
      "date": "2025-11-20",
      "time": "15:00",
      "partySize": 2
    }
  }'
```

**Verify:**
- ✅ Urgent but friendly
- ✅ Encourages quick action

#### Step 3.5: Error Handling
```bash
# Missing type
curl -X POST http://localhost:3002/api/ai/generate-email \
  -H "Content-Type: application/json" \
  -d '{"bookingData": {...}}'
# Should return 400
```

---

### Test 4: AI Usage Statistics (Admin Only)

#### Step 4.1: Get Stats
```bash
# First, get admin token (login via browser or API)
# Then:
curl http://localhost:3002/api/ai/stats \
  -H "Cookie: token=your-admin-token"
```

**Expected Response:**
```json
{
  "monthlyUsage": 1250,
  "usageLimit": 100000,
  "remaining": 98750,
  "provider": "openai"
}
```

**Verify:**
- ✅ Usage is tracked
- ✅ Limits shown correctly
- ✅ Provider information

---

## 🎯 Test Cases Summary

### Functional Tests

| Test ID | Feature | Test Case | Expected Result |
|---------|---------|----------|----------------|
| TC-1 | Recommendations | Get recommendations for existing user | Returns 1-3 personalized recommendations |
| TC-2 | Recommendations | Get recommendations for new user | Returns top available slots |
| TC-3 | Recommendations | Missing email parameter | Returns 400 error |
| TC-4 | Natural Language | "Find tomorrow afternoon slots" | Parses intent, finds matching slots |
| TC-5 | Natural Language | "Book for next Sunday for 3 people" | Extracts date, time, party size |
| TC-6 | Natural Language | "Cancel my booking" | Recognizes cancel intent |
| TC-7 | Natural Language | Invalid message | Returns error or fallback |
| TC-8 | Email Gen | Generate confirmation email | Personalized, professional email |
| TC-9 | Email Gen | Generate reminder email | Brief, helpful reminder |
| TC-10 | Email Gen | Invalid type | Returns 400 error |
| TC-11 | Usage Stats | Get stats as admin | Returns usage information |
| TC-12 | Usage Stats | Get stats as non-admin | Returns 403 error |

### Performance Tests

| Test ID | Feature | Metric | Expected |
|---------|---------|--------|----------|
| PT-1 | Recommendations | Response time | < 3 seconds |
| PT-2 | Natural Language | Response time | < 3 seconds |
| PT-3 | Email Generation | Response time | < 5 seconds |

### Edge Cases

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| EC-1 | No available slots | Returns empty array with message |
| EC-2 | AI service unavailable | Falls back to basic recommendations |
| EC-3 | Invalid email format | Returns recommendations or error gracefully |
| EC-4 | Very long natural language | Handles and parses correctly |
| EC-5 | Special characters in name | Email generation works correctly |

---

## 🔍 Browser Testing

### Test Recommendations in Frontend

1. **Start the application:**
   ```bash
   npm run build
   npm start
   ```

2. **Navigate to booking page:**
   ```
   http://localhost:3002/booking
   ```

3. **Enter an email address** (e.g., `test@example.com`)

4. **Verify:**
   - Recommendations section appears
   - Shows "✨ Recommended for You" heading
   - Displays 1-3 recommended slots
   - Each slot shows reason for recommendation
   - Can click to select slot

### Test Natural Language (Manual)

1. Open browser console (F12)
2. Run:
   ```javascript
   fetch('/api/booking/natural-language', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       message: 'Book me for next Sunday afternoon',
       email: 'test@example.com'
     })
   })
   .then(r => r.json())
   .then(console.log);
   ```

---

## 🐛 Troubleshooting

### Issue: "OPENAI_API_KEY is not set"
**Solution:** Add API key to `.env` file and restart server

### Issue: "Ollama API error"
**Solution:** 
- Install Ollama: `brew install ollama` (Mac) or download from ollama.ai
- Start server: `ollama serve`
- Pull model: `ollama pull llama3`

### Issue: Slow responses
**Solution:**
- Use `gpt-4o-mini` (fastest OpenAI model)
- For Ollama, use smaller models: `llama3` instead of `llama3:70b`

### Issue: Recommendations not appearing
**Solution:**
- Check browser console for errors
- Verify email format is valid
- Ensure slots exist in database
- Check API response in Network tab

### Issue: Natural language not parsing correctly
**Solution:**
- Try rephrasing (e.g., "find slots" instead of "get appointments")
- Check console logs for AI response
- Verify AI provider is working (test with simple prompt)

---

## 📊 Expected Results

### Success Criteria:
- ✅ All automated tests pass (10/10)
- ✅ Recommendations appear in < 3 seconds
- ✅ Natural language parsing accuracy > 85%
- ✅ Email generation produces readable, personalized content
- ✅ Error handling works for all edge cases
- ✅ Fallback works when AI unavailable

### Performance Benchmarks:
- Recommendations: < 3 seconds
- Natural Language: < 3 seconds
- Email Generation: < 5 seconds
- API availability: > 99%

---

## 📝 Test Report Template

```markdown
# AI Functionality Test Report

**Date:** YYYY-MM-DD
**Tester:** Your Name
**Environment:** Development/Production
**Provider:** OpenAI/Ollama

## Results Summary
- Total Tests: 12
- Passed: X
- Failed: Y
- Success Rate: Z%

## Issues Found
1. Issue description
2. Issue description

## Recommendations
1. Suggestion
2. Suggestion
```

---

## ✅ Checklist

Before marking testing complete:

- [ ] All automated tests pass
- [ ] Manual tests completed
- [ ] Browser testing done
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] Documentation reviewed
- [ ] Edge cases tested
- [ ] Admin features tested
- [ ] Cost monitoring working
- [ ] Fallback behavior confirmed

---

**Last Updated:** 2025-11-02  
**Version:** 1.0

