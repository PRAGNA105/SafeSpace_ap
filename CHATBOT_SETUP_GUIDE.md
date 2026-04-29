# Smart AI Chatbot - SafeSpace Implementation Guide

## Overview

The Smart AI Chatbot is an AI-powered mental wellness assistant integrated into SafeSpace. It uses OpenAI's GPT API to provide intelligent, empathetic responses to students seeking mental health support, safety information, and guidance.

## Features

✅ **AI-Powered Responses** - Uses OpenAI's GPT-3.5-turbo for intelligent conversations
✅ **Intent Detection** - Automatically detects user intent (emergency, wellness, counseling, etc.)
✅ **Mood Detection** - Identifies emotional state from user message
✅ **Emergency Response** - Immediate action for critical safety situations
✅ **Contextual Suggestions** - Smart suggestions based on user's emotional state and intent
✅ **Quick Actions** - One-click buttons to navigate to relevant SafeSpace features
✅ **Conversation History** - Maintains context across multiple messages
✅ **Loading States** - Visual feedback while waiting for AI response
✅ **Responsive UI** - Works on all screen sizes with Tailwind CSS

## Architecture

```
Frontend (React TypeScript):
├── src/components/ChatbotAssistant.tsx    (Floating chat widget)
└── Uses sonner for toast notifications

Backend (Node.js/Express):
├── backend-node/controllers/chatbotController.js    (OpenAI integration)
├── backend-node/index.js                            (API endpoints)
└── backend-node/.env                                (Configuration)
```

## Setup Instructions

### 1. Get OpenAI API Key

1. Visit: https://platform.openai.com/account/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (you'll only see it once!)
5. Store it securely - never commit to git

### 2. Configure Environment Variables

Update `backend-node/.env`:

```bash
PORT=5001
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
EMERGENCY_CONTACT_NUMBER=+91xxxxx
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Install Dependencies

The OpenAI package is already installed. Verify it's in `backend-node/package.json`:

```bash
cd backend-node
npm list openai
```

### 4. Start the Backend

```bash
cd backend-node
npm run dev
# or
npm start
```

The backend should be running at: `http://localhost:5001`

Verify the chatbot endpoint is working:
```bash
curl http://localhost:5001/api/chatbot/health
```

### 5. Verify Frontend is Using Correct API URL

The ChatbotAssistant component connects to: `http://localhost:5001/api/chatbot`

**For production**, update the URL in [src/components/ChatbotAssistant.tsx](../src/components/ChatbotAssistant.tsx) line 110:

```typescript
const response = await fetch('http://your-production-url/api/chatbot', {
  // ...
});
```

## API Endpoints

### POST /api/chatbot

Send a message to the chatbot and receive an AI-powered response.

**Request:**
```json
{
  "message": "I'm feeling stressed about my exams",
  "conversationHistory": [
    {
      "text": "Hello!",
      "sender": "user"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "reply": "I understand exam stress is challenging...",
  "intent": "wellness",
  "mood": "upset",
  "suggestions": ["Log your mood", "Try breathing exercises"],
  "quickActions": [
    {"label": "Wellness Hub", "action": "/wellness"},
    {"label": "Book Counseling", "action": "/resources"}
  ],
  "timestamp": "2024-03-22T10:30:00.000Z"
}
```

### GET /api/chatbot/health

Check if the chatbot is ready and configured.

**Response:**
```json
{
  "status": "ready|not_configured",
  "message": "Chatbot is ready",
  "openaiConfigured": true
}
```

### GET /api/health

Overall backend health check.

**Response:**
```json
{
  "status": "OK",
  "message": "SafeSpace Backend is running",
  "twilioConfigured": true,
  "chatbotConfigured": true,
  "features": {
    "emergencyCallAndSMS": "enabled",
    "aiChatbot": "enabled"
  }
}
```

## Intent Types

The chatbot automatically detects user intent:

| Intent | Triggers | Response Type |
|--------|----------|---------------|
| **emergency** | "help", "danger", "emergency" | Immediate safety response with emergency resources |
| **wellness** | "stressed", "anxious", "depression" | Mental health support & wellness resources |
| **counseling** | "therapy", "counselor", "talk" | Professional help recommendations |
| **navigation** | "features", "how to", "show me" | App feature guide |
| **general** | Other messages | General supportive response |

## Mood Detection

The chatbot identifies emotional states:

- **upset** - Sad, depressed, anxious, worried, scared, etc.
- **frustrated** - Angry, annoyed, problems, complaints
- **happy** - Great, awesome, wonderful, doing well
- **confused** - Lost, don't understand, uncertain
- **neutral** - Fine, okay, good (default)

## Emergency Safety Features

### When Emergency Words Are Detected

If the user mentions: "emergency", "help me", "danger", "unsafe", "threat", or "suicidal"

**Chatbot Response:**
```
🚨 Your safety is my priority. Please reach out for immediate help:
• Emergency Services: 112 (Police) or 100 (Ambulance)
• Campus Security: Available 24/7
• National Mental Health Helpline: [number]

Would you like me to show you more emergency resources?
```

**Quick Actions:**
- Safety Hub (Emergency buttons)
- Security Directory (Emergency numbers)
- Emergency Call Feature

## Conversation Context

The chatbot maintains conversation context by accepting `conversationHistory`:

```typescript
// Frontend passes last 5 messages for context
const response = await fetch('/api/chatbot', {
  method: 'POST',
  body: JSON.stringify({
    message: userMessage,
    conversationHistory: messages.slice(-5)
  })
});
```

This allows the AI to provide contextual, coherent responses across multiple turns.

## Frontend Component Usage

The ChatbotAssistant is already integrated into [App.tsx](../src/App.tsx):

```typescript
import ChatbotAssistant from './components/ChatbotAssistant';

// At the bottom of your app, after Routes:
<ChatbotAssistant />
```

The component:
- Appears on **all pages** automatically
- Floating button in bottom-right corner
- Opens/closes chat window on click
- Shows typing animation while loading
- Auto-scrolls to latest messages
- Displays mood indicator

## Customization

### Change System Prompt

Edit the system prompt in [backend-node/controllers/chatbotController.js](../backend-node/controllers/chatbotController.js):

```javascript
const SYSTEM_PROMPT = `You are SafeSpace AI Assistant...`
```

### Modify Quick Action Routes

Update routes in the response suggestions:

```javascript
quickActions: [
  { label: "Custom Button", action: "/custom-route" },
  { label: "Another Button", action: "/another-route" }
]
```

### Change Styling

Edit Tailwind classes in [src/components/ChatbotAssistant.tsx](../src/components/ChatbotAssistant.tsx):

```typescript
// Chat window styling
className="fixed bottom-6 right-6 z-50 w-96..."

// Header gradient
className="bg-gradient-to-r from-blue-600 to-purple-600..."

// Message styling
className="bg-blue-600 text-white..."
```

### Adjust Model Parameters

In `chatbotController.js`, modify:

```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',  // Can use 'gpt-4' for better quality
  temperature: 0.7,         // Lower = more deterministic (0.3-0.7)
  max_tokens: 500,          // Max response length
});
```

## Testing

### Manual Testing

1. Start backend: `npm run dev` (in backend-node/)
2. Start frontend: `npm run dev` (in root)
3. Open browser to `http://localhost:5173`
4. Click chat icon in bottom-right
5. Type test messages

### Test Messages

```
✅ "Hi" → Greeting response
✅ "I feel stressed" → Wellness response
✅ "I need help, emergency!" → Emergency response
✅ "How do I use this app?" → Navigation response
✅ "I want to talk to a counselor" → Counseling response
```

### API Testing with curl

```bash
# Test chatbot endpoint
curl -X POST http://localhost:5001/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "I feel stressed"}'

# Check chatbot health
curl http://localhost:5001/api/chatbot/health

# Check overall backend health
curl http://localhost:5001/api/health
```

## Error Handling

### Common Issues

**Issue: "OpenAI API key not configured"**
- Solution: Add `OPENAI_API_KEY` to `.env` file

**Issue: CORS Error in Frontend**
- Solution: Backend already has CORS enabled, check port is correct

**Issue: Empty responses from chatbot**
- Solution: Verify OpenAI API key is valid and has credits

**Issue: 429 Rate Limited**
- Solution: You've exceeded OpenAI rate limit, wait and retry

## Safety Guidelines

✅ **Always do:**
- Never ask for diagnosis - recommend professionals
- Always provide emergency resources for serious issues
- Never store sensitive personal information
- Sanitize all user inputs
- Use HTTPS in production

❌ **Never do:**
- Provide medical diagnoses
- Replace professional mental health services
- Make promises you can't keep
- Ignore emergency keywords
- Store conversation data indefinitely

## Performance Tips

1. **Limit conversation history** - Only send last 5 messages to reduce tokens
2. **Use faster models** - gpt-3.5-turbo is faster than gpt-4
3. **Cache responses** - Consider caching common questions
4. **Batch requests** - Group similar requests efficiently
5. **Monitor token usage** - Check OpenAI dashboard regularly

## Monitoring & Logs

Backend logs show:
```
💬 Processing message with OpenAI...
✅ OpenAI response received
❌ OpenAI error: ...
```

Frontend console shows:
```
Chatbot error: ...
🔵 Quick Action clicked: /safety
🔵 Navigating to: /safety
```

## Production Deployment

### Environment Setup

1. Set `OPENAI_API_KEY` in production environment
2. Update API URL to production domain
3. Enable HTTPS
4. Implement request validation

### Example for Vercel/Netlify

Add to environment variables in dashboard:
```
OPENAI_API_KEY=sk-your-production-key
```

Update frontend URL in ChatbotAssistant.tsx:
```typescript
const response = await fetch('https://your-api-domain.com/api/chatbot', {
```

### Monitoring

- Monitor OpenAI API usage and costs
- Track error rates in backend logs
- Monitor response times
- Set up alerting for failures

## Cost Estimation

OpenAI pricing (as of 2024):
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens
- Average message: ~50 tokens input + 150 tokens output = ~200 tokens
- Cost per message: ~$0.0004 (0.04 cents)

For 1000 daily active users per day:
- ~$120-150/month (estimated)

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Models](https://platform.openai.com/docs/models)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## Support & Troubleshooting

For issues:
1. Check backend logs: `npm run dev`
2. Verify API key configuration
3. Test endpoint with curl
4. Check OpenAI account status
5. Review error messages in console

## Version History

- **v1.0** (2024-03-22)
  - Initial Smart AI Chatbot implementation
  - OpenAI GPT-3.5-turbo integration
  - Intent & mood detection
  - Emergency response system
  - Conversation context support
  - Full SafeSpace feature integration
