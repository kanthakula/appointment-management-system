# ⚡ Quick AI Functionality Test Guide

## 🚀 Fast Testing (5 minutes)

### Prerequisites
- ✅ Server running: `npm start`
- ✅ OpenAI API key in `.env` (or Ollama running)

---

## Step-by-Step Testing

### 1. Test Smart Recommendations (1 min)

```bash
curl "http://localhost:3002/api/slots/recommendations?email=test@example.com"
```

**✅ Expected:** JSON with recommendations array

---

### 2. Test Natural Language - Find (1 min)

```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me slots for tomorrow afternoon", "email": "test@example.com"}'
```

**✅ Expected:** Intent parsed with action="find", time="afternoon"

---

### 3. Test Natural Language - Book (1 min)

```bash
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "Book me for next Sunday afternoon for 3 people", "email": "test@example.com"}'
```

**✅ Expected:** Intent with action="book", partySize=3, time="afternoon"

---

### 4. Test Email Generation (1 min)

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

**✅ Expected:** Personalized email content with name "John Doe"

---

### 5. Run Automated Tests (1 min)

```bash
node tests/ai-tests.js
```

**✅ Expected:** 9-10 tests passing

---

## ✅ Success Criteria

- [ ] Recommendations endpoint returns data
- [ ] Natural language parses correctly
- [ ] Email generation works
- [ ] Automated tests pass (80%+)

---

## 🐛 Quick Troubleshooting

**Issue:** 404 errors
- ✅ Restart server: `npm start`

**Issue:** "API key not set"
- ✅ Add `OPENAI_API_KEY=sk-...` to `.env`

**Issue:** Slow responses
- ✅ Normal: AI takes 2-5 seconds
- ✅ Use `gpt-4o-mini` (fastest)

---

## 📊 Test Results Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Recommendations | ⬜ | |
| Natural Language | ⬜ | |
| Email Generation | ⬜ | |
| Error Handling | ⬜ | |

---

**Total Time:** ~5 minutes  
**Difficulty:** Easy  
**Prerequisites:** Server running

