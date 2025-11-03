# 🚀 AI Integration Quick Start Guide

## Get Started in 15 Minutes

### Step 1: Choose Your AI Provider

#### Option A: OpenAI (Easiest, $5-15/month)
```bash
npm install openai
```

Add to `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
AI_PROVIDER=openai
```

#### Option B: Ollama (Free, Self-hosted)
```bash
# Install Ollama from https://ollama.ai
# Then pull a model:
ollama pull llama3

# No API key needed!
```

Add to `.env`:
```bash
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
```

---

### Step 2: Create AI Service Wrapper

Create `utils/aiService.js`:
```javascript
require('dotenv').config();

class AIService {
  async generate(prompt, model = 'gpt-4o-mini') {
    if (process.env.AI_PROVIDER === 'ollama') {
      return this.ollamaGenerate(prompt);
    } else {
      return this.openaiGenerate(prompt, model);
    }
  }

  async ollamaGenerate(prompt) {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: prompt,
        stream: false
      })
    });
    const data = await response.json();
    return data.response;
  }

  async openaiGenerate(prompt, model) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    return response.choices[0].message.content;
  }

  async generateJSON(prompt, model = 'gpt-4o-mini') {
    let response;
    if (process.env.AI_PROVIDER === 'ollama') {
      const text = await this.ollamaGenerate(prompt + '\n\nRespond in valid JSON format only.');
      // Simple JSON extraction (improve with proper parsing)
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch (e) {
        return {};
      }
    } else {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      response = await openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      return JSON.parse(response.choices[0].message.content);
    }
  }
}

module.exports = new AIService();
```

---

### Step 3: Add Smart Recommendations API

Add to `server.js` (after your existing routes):

```javascript
const aiService = require('./utils/aiService');

// Smart slot recommendations
app.get('/api/slots/recommendations', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Get available slots
    const availableSlots = await prisma.timeslot.findMany({
      where: {
        published: true,
        archived: false,
        date: { gte: new Date() },
        remaining: { gt: 0 }
      },
      orderBy: { date: 'asc' },
      take: 20
    });

    // Get user's booking history
    const history = await prisma.registration.findMany({
      where: { email: email },
      include: { timeslot: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Generate AI recommendations
    const prompt = `Based on this user's booking history, suggest the 3 best time slots from available slots.

User's previous bookings:
${history.map(h => `- ${h.timeslot.date.toISOString().split('T')[0]} at ${h.timeslot.start} (party size: ${h.partySize})`).join('\n')}

Available slots:
${availableSlots.map(s => `- ID: ${s.id}, Date: ${s.date.toISOString().split('T')[0]}, Time: ${s.start}-${s.end || 'N/A'}, Remaining: ${s.remaining}/${s.capacity}`).join('\n')}

Respond in JSON format:
{
  "recommendations": [
    {
      "slotId": "slot-id-here",
      "reason": "Why this slot is recommended"
    }
  ]
}`;

    const aiResponse = await aiService.generateJSON(prompt);
    
    // Map AI recommendations to actual slots
    const recommendations = aiResponse.recommendations
      .map(rec => {
        const slot = availableSlots.find(s => s.id === rec.slotId);
        return slot ? {
          ...slot,
          recommendationReason: rec.reason
        } : null;
      })
      .filter(Boolean)
      .slice(0, 3);

    res.json({ recommendations });
  } catch (error) {
    console.error('AI recommendation error:', error);
    // Fallback: return top 3 slots
    const fallback = await prisma.timeslot.findMany({
      where: {
        published: true,
        archived: false,
        date: { gte: new Date() },
        remaining: { gt: 0 }
      },
      orderBy: { date: 'asc' },
      take: 3
    });
    res.json({ recommendations: fallback, fallback: true });
  }
});
```

---

### Step 4: Add Natural Language Booking

Add to `server.js`:

```javascript
// Natural language booking
app.post('/api/booking/natural-language', async (req, res) => {
  try {
    const { message, email } = req.body;

    // Parse intent using AI
    const prompt = `Extract booking intent from this user message: "${message}"

Return JSON with:
- action: "book" | "cancel" | "find" | "modify"
- date: YYYY-MM-DD format or relative like "tomorrow", "next sunday", "this saturday"
- time: preferred time like "morning", "afternoon", "evening", or specific time like "14:00"
- partySize: number if mentioned, otherwise null

Example: "I want to book for next Sunday afternoon for 3 people"
Output: {"action": "book", "date": "next sunday", "time": "afternoon", "partySize": 3}`;

    const intent = await aiService.generateJSON(prompt);

    // Convert relative dates to actual dates
    let actualDate = null;
    if (intent.date) {
      if (intent.date.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        actualDate = tomorrow.toISOString().split('T')[0];
      } else if (intent.date.includes('sunday') || intent.date.includes('Sunday')) {
        // Find next Sunday
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
        const nextSunday = new Date(today);
        nextSunday.setDate(today.getDate() + daysUntilSunday);
        actualDate = nextSunday.toISOString().split('T')[0];
      } else {
        // Try to parse as date
        actualDate = intent.date;
      }
    }

    // Find matching slots
    const timeFilter = intent.time ? {
      OR: [
        { start: { contains: intent.time.includes('morning') ? '08' : intent.time.includes('afternoon') ? '14' : '18' } },
        { start: { gte: intent.time } }
      ]
    } : {};

    const matchingSlots = await prisma.timeslot.findMany({
      where: {
        published: true,
        archived: false,
        date: actualDate ? { equals: new Date(actualDate) } : { gte: new Date() },
        remaining: { gt: 0 },
        ...timeFilter
      },
      orderBy: { date: 'asc' },
      take: 10
    });

    res.json({
      intent,
      matchingSlots: matchingSlots,
      message: `Found ${matchingSlots.length} available slots matching your request`
    });
  } catch (error) {
    console.error('Natural language booking error:', error);
    res.status(500).json({ error: 'Failed to process request. Please try again with different wording.' });
  }
});
```

---

### Step 5: Update Frontend (Optional)

Add to `src/pages/BookingPage.jsx`:

```jsx
import { useState } from 'react';

function BookingPage() {
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [showNaturalLanguage, setShowNaturalLanguage] = useState(false);
  const [nlInput, setNlInput] = useState('');
  const [nlResults, setNlResults] = useState(null);

  // Fetch AI recommendations when email is entered
  const fetchRecommendations = async (email) => {
    if (!email) return;
    try {
      const response = await fetch(`/api/slots/recommendations?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setAiRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  // Natural language booking
  const handleNaturalLanguage = async () => {
    try {
      const response = await fetch('/api/booking/natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: nlInput,
          email: email // your email state
        })
      });
      const data = await response.json();
      setNlResults(data);
    } catch (error) {
      alert('Failed to process. Please try again.');
    }
  };

  return (
    <div>
      {/* Add AI Recommendations Section */}
      {aiRecommendations.length > 0 && (
        <div className="ai-recommendations">
          <h3>✨ Recommended for You</h3>
          {aiRecommendations.map(slot => (
            <div key={slot.id} className="recommended-slot">
              <p>{slot.recommendationReason}</p>
              {/* Show slot details */}
            </div>
          ))}
        </div>
      )}

      {/* Natural Language Input */}
      <button onClick={() => setShowNaturalLanguage(!showNaturalLanguage)}>
        💬 Book with Natural Language
      </button>
      
      {showNaturalLanguage && (
        <div>
          <input
            type="text"
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
            placeholder="e.g., 'Book me for next Sunday afternoon for 3 people'"
          />
          <button onClick={handleNaturalLanguage}>Find Slots</button>
          {nlResults && (
            <div>
              <p>{nlResults.message}</p>
              {/* Display matching slots */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Step 6: Test It Out!

1. **Start your server**: `npm start`
2. **Test recommendations**:
   ```bash
   curl "http://localhost:3002/api/slots/recommendations?email=user@example.com"
   ```

3. **Test natural language**:
   ```bash
   curl -X POST http://localhost:3002/api/booking/natural-language \
     -H "Content-Type: application/json" \
     -d '{"message": "Book me for next Sunday afternoon", "email": "user@example.com"}'
   ```

---

## 🎉 You're Done!

You now have:
- ✅ AI-powered slot recommendations
- ✅ Natural language booking interface
- ✅ Cost-effective setup (free with Ollama or ~$5-15/month with OpenAI)

**Next Steps**: See `AI_INTEGRATION_PLAN.md` for more features!

---

## 💡 Pro Tips

1. **Start with Ollama** (free) to test, then migrate to OpenAI if needed
2. **Add rate limiting** to control costs:
   ```javascript
   const rateLimiter = require('express-rate-limit');
   const aiLimiter = rateLimiter({ windowMs: 60000, max: 10 }); // 10 req/min
   app.use('/api/slots/recommendations', aiLimiter);
   ```

3. **Cache results** to save API calls:
   ```javascript
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour
   ```

4. **Monitor usage** to stay within budget:
   ```javascript
   let monthlyUsage = 0;
   // Track in database or file
   ```

---

**Questions?** Check the full `AI_INTEGRATION_PLAN.md` for detailed implementation guides!

