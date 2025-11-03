# 🤖 AI Integration Setup Guide

## Environment Variables

Add these to your `.env` file:

### Option 1: OpenAI (Recommended for production)
```bash
# AI Configuration
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Set usage limits
AI_USAGE_LIMIT_MONTHLY=100000  # tokens per month
```

**Get OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy and paste into `.env`

**Cost**: ~$5-20/month for moderate usage (1000-2000 users)

---

### Option 2: Ollama (Free, Self-hosted)
```bash
# AI Configuration
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434

# Optional
AI_USAGE_LIMIT_MONTHLY=1000000  # Higher limit since it's free
```

**Setup Ollama:**
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3`
3. Ensure Ollama is running: `ollama serve`
4. Set `AI_PROVIDER=ollama` in `.env`

**Cost**: $0 (runs on your machine)

---

## Quick Start

### Step 1: Choose Your Provider

**For production/testing**: Use OpenAI (easier, cloud-based)
```bash
echo "AI_PROVIDER=openai" >> .env
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
```

**For development/free**: Use Ollama (requires local setup)
```bash
echo "AI_PROVIDER=ollama" >> .env
```

### Step 2: Restart Server

```bash
npm start
```

### Step 3: Test AI Features

```bash
# Test recommendations
curl "http://localhost:3002/api/slots/recommendations?email=test@example.com"

# Test natural language
curl -X POST http://localhost:3002/api/booking/natural-language \
  -H "Content-Type: application/json" \
  -d '{"message": "Book me for next Sunday afternoon", "email": "test@example.com"}'
```

---

## API Endpoints Added

### 1. Smart Slot Recommendations
```
GET /api/slots/recommendations?email=user@example.com
```
Returns AI-powered slot recommendations based on user's booking history.

### 2. Natural Language Booking
```
POST /api/booking/natural-language
Body: { "message": "Book me for next Sunday afternoon", "email": "user@example.com" }
```
Parses natural language and finds matching slots.

### 3. AI Email Generation
```
POST /api/ai/generate-email
Body: { 
  "type": "confirmation" | "reminder" | "cancellation" | "waitlist",
  "bookingData": { "name", "date", "time", "partySize" }
}
```
Generates personalized email content.

### 4. AI Usage Stats (Admin Only)
```
GET /api/ai/stats
```
Shows current AI usage statistics (tokens used, limits, etc.).

---

## Cost Management

### Monitor Usage

Check AI stats via admin panel or API:
```bash
curl http://localhost:3002/api/ai/stats \
  -H "Cookie: token=your-admin-token"
```

### Set Usage Limits

In `.env`:
```bash
AI_USAGE_LIMIT_MONTHLY=50000  # Lower limit for cost control
```

### Estimate Costs

**OpenAI GPT-4o-mini:**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- Average request: ~500 tokens
- 1000 requests ≈ $0.38

**Example monthly costs:**
- 500 users/month: ~$2-5
- 2000 users/month: ~$8-15
- 5000 users/month: ~$20-30

---

## Troubleshooting

### Error: "OPENAI_API_KEY is not set"
- Make sure `.env` file has `OPENAI_API_KEY=sk-...`
- Restart server after adding to `.env`

### Error: "Ollama API error"
- Ensure Ollama is running: `ollama serve`
- Check `OLLAMA_URL` in `.env` matches your Ollama server
- Try: `curl http://localhost:11434/api/tags` to verify Ollama is running

### Error: "Monthly AI usage limit reached"
- Increase `AI_USAGE_LIMIT_MONTHLY` in `.env`
- Or reset counter in code: `aiService.resetUsage()`

### AI responses are slow
- Use `gpt-4o-mini` (faster, cheaper) instead of `gpt-4`
- For Ollama, use smaller models: `llama3` instead of `llama3:70b`

---

## Next Steps

1. ✅ Set up environment variables
2. ✅ Test API endpoints
3. 📱 Integrate with frontend (see `AI_QUICK_START.md`)
4. 📊 Monitor usage via admin dashboard
5. 🚀 Deploy to production

---

## Support

- **OpenAI Docs**: https://platform.openai.com/docs
- **Ollama Docs**: https://ollama.ai/docs
- **Full Integration Plan**: See `AI_INTEGRATION_PLAN.md`

---

**Last Updated**: 2025-11-02

