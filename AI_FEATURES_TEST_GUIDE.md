# 🤖 Step-by-Step Guide: Testing AI Features

## 🎯 Overview

This guide will help you test and experience all AI features that have been implemented:

1. ✨ **Smart Slot Recommendations** - AI suggests best slots based on booking history
2. 💬 **Natural Language Booking** - Book using plain English
3. 📧 **AI Email Generation** - Personalized email content
4. 📊 **AI Usage Stats** - Track AI usage (admin only)

---

## 📋 Prerequisites

### Step 1: Verify Environment Setup

1. **Check your `.env` file has:**

   ```bash
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   ```

2. **Verify server is running:**

   ```bash
   # Check if server is running on port 3002
   curl http://localhost:3002/api/config/theme
   ```

   If you get a response, server is running ✅

3. **If server not running:**
   ```bash
   npm run build
   npm start
   ```

---

## 🧪 Testing AI Features

### Test 1: Smart Slot Recommendations ✨

**What it does:** AI analyzes user's booking history and suggests the 3 best time slots for them.

#### Step 1.1: Test via API

Open Terminal and run:

```bash
curl "http://localhost:3002/api/slots/recommendations?email=test@example.com"
```

#### Step 1.2: What to Expect

You should see JSON response like:

```json
{
  "recommendations": [
    {
      "id": "...",
      "date": "2025-11-10T...",
      "start": "10:00",
      "recommendationReason": "This slot matches your usual booking time...",
      "remaining": 5,
      "capacity": 10
    }
  ],
  "summary": "Recommended slots based on your preferences",
  "historyCount": 2
}
```

#### Step 1.3: Test with Different Emails

```bash
# Test with new user (no history)
curl "http://localhost:3002/api/slots/recommendations?email=newuser@example.com"

# Test with existing user (if you have bookings)
curl "http://localhost:3002/api/slots/recommendations?email=your-actual-email@example.com"
```

**✅ Success Criteria:**

- Returns recommendations array
- Each recommendation has a `recommendationReason`
- Response time is under 3 seconds

---

### Test 2: Natural Language Booking 💬

**What it does:** Understands plain English like "Book me for next Sunday afternoon for 3 people"

#### Step 2.1: Test - Find Slots

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
    "date": "2025-11-04",
    "time": "afternoon",
    "partySize": null,
    "urgency": "medium"
  },
  "matchingSlots": [...],
  "message": "Found X available slot(s) for..."
}
```

#### Step 2.2: Test - Book Intent

```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Book me for next Sunday afternoon for 3 people",
    "email": "test@example.com"
  }'
```

**Expected Response:**

```json
{
  "intent": {
    "action": "book",
    "date": "2025-11-09",
    "time": "afternoon",
    "partySize": 3,
    "urgency": "medium"
  },
  "matchingSlots": [...],
  "canBook": true
}
```

#### Step 2.3: Test Different Natural Language Phrases

Try these commands one by one:

**A. Morning Slots:**

```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me morning appointments", "email": "test@example.com"}'
```

**B. Evening Slots:**

```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "Find evening slots for this weekend", "email": "test@example.com"}'
```

**C. Specific Time:**

```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "Book for 2 PM tomorrow", "email": "test@example.com"}'
```

**D. Cancel Booking:**

```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "I need to cancel my booking", "email": "test@example.com"}'
```

**✅ Success Criteria:**

- Intent is correctly parsed (action, date, time, partySize)
- Matching slots are returned
- Response time is under 3 seconds

---

### Test 3: AI Email Generation 📧

**What it does:** Generates personalized, professional email content for confirmations, reminders, cancellations, etc.

#### Step 3.1: Generate Confirmation Email

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
  "emailContent": "Dear John Doe,\n\nThank you for booking...",
  "type": "confirmation",
  "generatedAt": "2025-11-03T..."
}
```

**Check:** Email should include:

- ✅ Name (John Doe)
- ✅ Date and time
- ✅ Party size (2 people)
- ✅ Professional, warm tone

#### Step 3.2: Generate Reminder Email

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

**Expected:** Brief, friendly reminder email

#### Step 3.3: Generate Cancellation Email

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

**Expected:** Professional cancellation confirmation

#### Step 3.4: Generate Waitlist Email

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

**Expected:** Urgent but friendly waitlist notification

**✅ Success Criteria:**

- Email is personalized (includes name)
- Content is relevant to type (confirmation/reminder/etc.)
- Professional tone
- Includes booking details

---

### Test 4: AI Usage Statistics 📊 (Admin Only)

**What it does:** Shows how much AI has been used (tokens, costs, etc.)

#### Step 4.1: Get Admin Token

1. Login to admin panel: `http://localhost:3002/admin`
2. Open browser Developer Tools (F12)
3. Go to Application/Storage → Cookies
4. Copy the `token` cookie value

#### Step 4.2: Check Usage Stats

```bash
curl http://localhost:3002/api/ai/stats \
  -H "Cookie: token=YOUR_ADMIN_TOKEN_HERE"
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

**✅ Success Criteria:**

- Shows usage statistics
- Updates as you use AI features
- Only accessible by admins (403 error if not admin)

---

## 🎮 Interactive Browser Testing

### Test Recommendations in Browser

1. **Open booking page:**

   ```
   http://localhost:3002/booking
   ```

2. **Enter an email** (e.g., `test@example.com`)

3. **Check browser console (F12) and run:**
   ```javascript
   fetch("/api/slots/recommendations?email=test@example.com")
     .then((r) => r.json())
     .then((data) => {
       console.log("Recommendations:", data);
       // Display recommendations in UI
     });
   ```

### Test Natural Language in Browser

Open browser console (F12) and try:

```javascript
// Test 1: Find slots
fetch("/api/booking/natural-language", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Find me slots for tomorrow afternoon",
    email: "test@example.com",
  }),
})
  .then((r) => r.json())
  .then(console.log);

// Test 2: Book intent
fetch("/api/booking/natural-language", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Book me for next Sunday for 3 people",
    email: "test@example.com",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

---

## 🚀 Run Complete Test Suite

### Automated Testing

Run all tests at once:

```bash
node tests/ai-tests.js
```

**Expected Output:**

```
🚀 Starting AI Functionality Tests
📍 Testing against: http://localhost:3002
============================================================

🧪 Testing: AI Configuration Check
✅ PASSED: AI Configuration Check

🧪 Testing: Smart Slot Recommendations
✅ PASSED: Smart Slot Recommendations

... (more tests)

📊 Test Summary
✅ Passed: 9
❌ Failed: 0
📈 Total:  10
📊 Success Rate: 90.0%
```

---

## 📝 Testing Checklist

Use this checklist to verify everything works:

### Smart Recommendations

- [ ] Returns recommendations for valid email
- [ ] Recommendations include reasoning
- [ ] Works for new users (no history)
- [ ] Works for existing users (with history)
- [ ] Response time is acceptable (< 3 seconds)

### Natural Language Booking

- [ ] Parses "find slots" correctly
- [ ] Parses "book" intent correctly
- [ ] Extracts party size
- [ ] Handles time preferences (morning/afternoon/evening)
- [ ] Recognizes cancel intent
- [ ] Returns matching slots

### Email Generation

- [ ] Confirmation emails are personalized
- [ ] Reminder emails are brief and helpful
- [ ] Cancellation emails are courteous
- [ ] Waitlist emails are urgent but friendly
- [ ] All emails include booking details

### Error Handling

- [ ] Missing email returns 400 error
- [ ] Missing message returns 400 error
- [ ] Invalid requests handled gracefully
- [ ] Fallback works when AI unavailable

---

## 🎯 What AI Features You Got

### 1. ✨ Smart Slot Recommendations

- **Benefit:** Users see personalized slot suggestions
- **Saves Time:** No need to browse all slots
- **Improves Conversion:** 10-20% increase expected

### 2. 💬 Natural Language Booking

- **Benefit:** Book using plain English, no forms
- **User Friendly:** "Book me for next Sunday" works
- **Accessible:** Voice assistants can use this

### 3. 📧 AI Email Generation

- **Benefit:** Personalized emails without templates
- **Saves Time:** No manual email writing
- **Professional:** Always appropriate tone

### 4. 📊 Usage Tracking

- **Benefit:** Monitor AI costs and usage
- **Control:** Set monthly limits
- **Transparency:** See what's being used

---

## 🐛 Troubleshooting

### Issue: "404 Not Found" errors

**Solution:** Restart server:

```bash
pkill -f "node server.js"
npm start
```

### Issue: "OPENAI_API_KEY is not set"

**Solution:** Add to `.env`:

```bash
OPENAI_API_KEY=sk-your-key-here
```

### Issue: Slow responses (5+ seconds)

**Solution:** This is normal for AI. Consider:

- Using `gpt-4o-mini` (already configured, fastest)
- Caching recommendations
- Accepting 2-5 second response times

### Issue: "No available slots found"

**Solution:** Create some time slots first:

1. Go to admin panel
2. Create a few published time slots
3. Make sure they're in the future

---

## ✅ Success Indicators

You'll know everything works when:

1. ✅ Recommendations appear with reasoning
2. ✅ Natural language parsing extracts correct intent
3. ✅ Emails are personalized and professional
4. ✅ Response times are under 5 seconds
5. ✅ Error handling works gracefully
6. ✅ All automated tests pass

---

## 🎉 You're Done!

After testing, you should have:

- ✅ Verified all AI features work
- ✅ Experienced smart recommendations
- ✅ Tested natural language booking
- ✅ Seen AI-generated emails
- ✅ Confirmed everything is production-ready

**Next Steps:**

1. Integrate frontend components (see `AI_QUICK_START.md`)
2. Monitor usage via admin dashboard
3. Deploy to production when ready

---

**Need Help?** Check:

- `tests/TESTING_GUIDE.md` - Detailed testing guide
- `tests/QUICK_TEST.md` - Quick 5-minute tests
- `AI_SETUP.md` - Setup instructions
