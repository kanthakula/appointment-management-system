# AI Implementation Guide - Practical Examples

## Quick Start: Most Impactful Features

### 1. Automated Email Personalization (Highest ROI)

#### Setup

```bash
npm install openai langchain
```

#### Implementation Example

```javascript
// services/aiEmailService.js
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generatePersonalizedEmail(bookingData, emailType) {
  const prompt = `
    Generate a ${emailType} email for an appointment booking:
    
    User: ${bookingData.userName}
    Date: ${bookingData.date}
    Time: ${bookingData.time}
    Previous bookings: ${bookingData.bookingHistory}
    
    Tone: Friendly and professional
    Language: ${bookingData.preferredLanguage || "English"}
    
    Include:
    - Confirmation of booking details
    - Reminder of what to bring (if relevant)
    - How to cancel/reschedule if needed
    - A warm, personalized closing
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful appointment booking assistant.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.choices[0].message.content;
}

// Usage in your existing email service
async function sendBookingConfirmation(booking) {
  const personalizedEmail = await generatePersonalizedEmail(
    booking,
    "confirmation"
  );
  await sendEmail(booking.email, "Booking Confirmed", personalizedEmail);
}
```

**Value**: Reduces email template maintenance, improves engagement, multi-language support

---

### 2. Intelligent Booking Assistant (Chatbot)

#### Setup

```bash
npm install express-rate-limit
```

#### Implementation Example

```javascript
// routes/aiAssistant.js
const express = require("express");
const { OpenAI } = require("openai");
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to check booking availability (your existing function)
async function checkAvailability(date, time) {
  // Your existing availability check logic
  return availableSlots;
}

// Function to create booking (your existing function)
async function createBooking(userId, slotId) {
  // Your existing booking creation logic
  return booking;
}

// AI Assistant endpoint
router.post("/api/ai-assistant", async (req, res) => {
  try {
    const { message, userId, context } = req.body;

    // Get user's booking history for context
    const userBookings = await prisma.booking.findMany({
      where: { userId },
      include: { timeslot: true },
    });

    // Get available slots
    const availableSlots = await prisma.timeslot.findMany({
      where: {
        published: true,
        archived: false,
        date: { gte: new Date() },
      },
    });

    const systemPrompt = `
You are a helpful appointment booking assistant. You can:
1. Check available appointment slots
2. Book appointments for users
3. Cancel or reschedule bookings
4. Answer questions about the booking system

Available slots: ${JSON.stringify(availableSlots.slice(0, 10))}
User's recent bookings: ${JSON.stringify(userBookings.slice(0, 5))}

When the user wants to book, respond with JSON:
{
  "action": "book",
  "slotId": <slot_id>,
  "intent": "confirmed"
}

When checking availability, respond with:
{
  "action": "check_availability",
  "date": <date>,
  "intent": "checking"
}

Otherwise, respond naturally in a friendly, helpful tone.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      functions: [
        {
          name: "book_appointment",
          description: "Book an appointment slot",
          parameters: {
            type: "object",
            properties: {
              slotId: { type: "string", description: "The slot ID to book" },
              date: {
                type: "string",
                description: "The date of the appointment",
              },
              time: {
                type: "string",
                description: "The time of the appointment",
              },
            },
            required: ["slotId"],
          },
        },
        {
          name: "check_availability",
          description: "Check available appointment slots",
          parameters: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Date to check (YYYY-MM-DD)",
              },
            },
          },
        },
      ],
      function_call: "auto",
    });

    const message = response.choices[0].message;

    // If AI wants to perform an action
    if (message.function_call) {
      const functionName = message.function_call.name;
      const args = JSON.parse(message.function_call.arguments);

      if (functionName === "book_appointment") {
        const booking = await createBooking(userId, args.slotId);
        return res.json({
          message: `Great! I've booked your appointment for ${args.date} at ${args.time}. Your booking ID is ${booking.id}.`,
          booking,
        });
      } else if (functionName === "check_availability") {
        const slots = await checkAvailability(args.date);
        return res.json({
          message: `Here are available slots for ${args.date}:`,
          slots,
        });
      }
    }

    // Natural language response
    res.json({ message: message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Value**: 24/7 automated support, reduces admin workload, improves UX

---

### 3. Smart Demand Prediction

#### Setup

```bash
npm install @tensorflow/tfjs-node brain.js
```

#### Implementation Example

```javascript
// services/demandPredictor.js
const tf = require("@tensorflow/tfjs-node");

class DemandPredictor {
  constructor() {
    this.model = null;
  }

  async train(historicalData) {
    // Prepare training data from historical bookings
    const features = historicalData.map((d) => [
      d.dayOfWeek,
      d.hourOfDay,
      d.month,
      d.isHoliday ? 1 : 0,
      d.season, // 0-3 for seasons
    ]);

    const labels = historicalData.map((d) => d.bookingCount);

    // Create and train model
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [5], units: 64, activation: "relu" }),
        tf.layers.dense({ units: 32, activation: "relu" }),
        tf.layers.dense({ units: 1, activation: "linear" }),
      ],
    });

    this.model.compile({
      optimizer: "adam",
      loss: "meanSquaredError",
    });

    await this.model.fit(tf.tensor2d(features), tf.tensor1d(labels), {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
    });
  }

  async predict(date, time) {
    if (!this.model) {
      throw new Error("Model not trained");
    }

    const dayOfWeek = date.getDay();
    const hourOfDay = parseInt(time.split(":")[0]);
    const month = date.getMonth();
    const isHoliday = 0; // Implement holiday detection
    const season = Math.floor(month / 3);

    const prediction = this.model.predict(
      tf.tensor2d([[dayOfWeek, hourOfDay, month, isHoliday, season]])
    );

    const demand = await prediction.data();
    return Math.round(demand[0]);
  }
}

// Usage
async function suggestOptimalSlots() {
  const predictor = new DemandPredictor();

  // Load historical booking data
  const historicalData = await prisma.booking.findMany({
    include: { timeslot: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  // Prepare training data
  const trainingData = historicalData.map((booking) => ({
    dayOfWeek: booking.timeslot.date.getDay(),
    hourOfDay: parseInt(booking.timeslot.startTime.split(":")[0]),
    month: booking.timeslot.date.getMonth(),
    isHoliday: 0,
    season: Math.floor(booking.timeslot.date.getMonth() / 3),
    bookingCount: 1,
  }));

  await predictor.train(trainingData);

  // Predict demand for next week
  const predictions = [];
  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);

    for (const time of ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]) {
      const predictedDemand = await predictor.predict(date, time);
      predictions.push({ date, time, predictedDemand });
    }
  }

  // Suggest creating slots with high predicted demand
  return predictions
    .filter((p) => p.predictedDemand > 5)
    .sort((a, b) => b.predictedDemand - a.predictedDemand);
}
```

**Value**: Optimize slot creation, reduce empty slots, maximize bookings

---

### 4. Fraud & Abuse Detection

#### Implementation Example

```javascript
// services/fraudDetector.js
class FraudDetector {
  calculateRiskScore(bookingData) {
    let riskScore = 0;
    const flags = [];

    // Check 1: Multiple bookings from same IP
    if (bookingData.ipBookingCount > 3) {
      riskScore += 30;
      flags.push("Multiple bookings from same IP");
    }

    // Check 2: Too fast booking (likely bot)
    if (bookingData.timeToBook < 2000) {
      // Less than 2 seconds
      riskScore += 25;
      flags.push("Unusually fast booking");
    }

    // Check 3: Booking all available slots
    if (bookingData.slotsBookedByUser >= 5) {
      riskScore += 20;
      flags.push("Excessive bookings");
    }

    // Check 4: Invalid or suspicious email pattern
    if (!this.isValidEmail(bookingData.email)) {
      riskScore += 15;
      flags.push("Invalid email format");
    }

    // Check 5: No-show history
    if (bookingData.noShowRate > 0.5) {
      riskScore += 20;
      flags.push("High no-show rate");
    }

    return {
      riskScore,
      flags,
      isHighRisk: riskScore > 50,
      isMediumRisk: riskScore > 30 && riskScore <= 50,
    };
  }

  async shouldBlockBooking(bookingData) {
    const analysis = this.calculateRiskScore(bookingData);

    if (analysis.isHighRisk) {
      // Log for admin review
      await prisma.fraudLog.create({
        data: {
          userId: bookingData.userId,
          riskScore: analysis.riskScore,
          flags: analysis.flags,
          action: "blocked",
        },
      });
      return true;
    }

    if (analysis.isMediumRisk) {
      // Require additional verification
      return { requiresVerification: true, reason: analysis.flags };
    }

    return false;
  }
}

// Usage in booking route
app.post("/api/register/:timeslotId", async (req, res) => {
  const fraudDetector = new FraudDetector();

  const bookingData = {
    userId: req.user?.id,
    ip: req.ip,
    ipBookingCount: await getBookingCountForIP(req.ip, "24h"),
    timeToBook: Date.now() - req.body.sessionStart,
    slotsBookedByUser: await getBookingCountForUser(req.user?.id),
    email: req.body.email,
    noShowRate: await getNoShowRate(req.user?.id),
  };

  const fraudCheck = await fraudDetector.shouldBlockBooking(bookingData);

  if (fraudCheck === true) {
    return res.status(403).json({
      error: "Booking blocked due to suspicious activity",
    });
  }

  if (fraudCheck?.requiresVerification) {
    return res.status(200).json({
      requiresVerification: true,
      message: "Please verify your booking",
    });
  }

  // Proceed with normal booking
  // ... existing booking logic
});
```

**Value**: Prevents abuse, ensures fair access, protects revenue

---

### 5. Intelligent Waitlist Management

#### Implementation Example

```javascript
// services/waitlistManager.js
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class WaitlistManager {
  async prioritizeWaitlist(slotId) {
    const waitlist = await prisma.waitlist.findMany({
      where: { timeslotId: slotId },
      include: { user: true },
    });

    // Score each waitlist entry
    const scored = waitlist.map((entry) => ({
      ...entry,
      score: this.calculatePriorityScore(entry),
    }));

    // Sort by priority
    return scored.sort((a, b) => b.score - a.score);
  }

  calculatePriorityScore(entry) {
    let score = 0;

    // Higher priority for earlier waitlist join
    score += (Date.now() - entry.createdAt) / (1000 * 60 * 60); // Hours waited

    // Higher priority for frequent users (loyalty)
    if (entry.user.bookingCount > 5) score += 10;

    // Higher priority for low no-show rate
    if (entry.user.noShowRate < 0.2) score += 15;

    // Lower priority for recent cancellations
    if (entry.user.recentCancellations > 2) score -= 20;

    return score;
  }

  async notifyWaitlistUser(entry, slot) {
    const personalizedMessage = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a friendly appointment booking assistant.",
        },
        {
          role: "user",
          content: `Write a friendly notification email to ${entry.user.name} that a slot has become available for ${slot.date} at ${slot.startTime}. They were on the waitlist. Keep it warm and personalized.`,
        },
      ],
      max_tokens: 150,
    });

    await sendEmail(
      entry.user.email,
      "A Slot Has Become Available!",
      personalizedMessage.choices[0].message.content
    );
  }

  async autoFillCancellation(cancelledSlotId) {
    const prioritizedWaitlist = await this.prioritizeWaitlist(cancelledSlotId);

    // Contact top 3 priority users
    for (const entry of prioritizedWaitlist.slice(0, 3)) {
      await this.notifyWaitlistUser(entry, cancelledSlotId);

      // Give them 2 hours to respond
      setTimeout(async () => {
        const responded = await checkUserResponse(entry.userId);
        if (!responded && entry === prioritizedWaitlist[0]) {
          // Move to next user
          await this.autoFillCancellation(cancelledSlotId);
        }
      }, 2 * 60 * 60 * 1000);
    }
  }
}
```

**Value**: Maximizes slot utilization, improves user experience, automated revenue recovery

---

## Cost Optimization Strategies

### 1. Hybrid Approach

- **Critical features** (booking, payments): Use premium APIs (GPT-4)
- **Routine tasks** (email templates, translations): Use cheaper models (GPT-3.5)
- **High-volume operations**: Consider self-hosted models (Llama 3)

### 2. Caching

```javascript
// Cache common AI responses
const redis = require("redis");
const client = redis.createClient();

async function getCachedResponse(prompt) {
  const cacheKey = `ai:${hash(prompt)}`;
  const cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await callAI(prompt);
  await client.setex(cacheKey, 3600, JSON.stringify(response)); // 1 hour cache
  return response;
}
```

### 3. Batch Processing

```javascript
// Process multiple emails in one API call
async function generateBatchEmails(bookings) {
  const batchPrompt = bookings
    .map((b) => `Generate email for: ${b.userName}, ${b.date}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: batchPrompt }],
  });

  // Split response into individual emails
  return parseBatchResponse(response);
}
```

---

## Environment Variables Setup

Add to your `.env`:

```bash
# AI/LLM Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_key  # Optional
AI_CACHE_ENABLED=true
AI_MODEL_TIER=standard  # or 'premium' for GPT-4
MAX_AI_REQUESTS_PER_MINUTE=60
```

---

## Next Steps

1. **Start Small**: Implement email personalization first (easiest, highest ROI)
2. **Measure Impact**: Track metrics (open rates, booking completion, user satisfaction)
3. **Scale Gradually**: Add chatbot → fraud detection → demand prediction
4. **Optimize Costs**: Monitor API usage, implement caching, consider self-hosted models
5. **Iterate**: Use feedback to refine AI prompts and models

---

## Monitoring & Analytics

Track these metrics:

- AI API costs per feature
- Response times
- User engagement with AI features
- Conversion rates (chatbot → booking)
- Error rates and fallback frequency
- User satisfaction scores
