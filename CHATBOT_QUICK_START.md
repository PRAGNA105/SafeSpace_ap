# Smart AI Chatbot - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/account/api-keys)
2. Click "Create new secret key"
3. Copy the key (save it somewhere safe!)

### Step 2: Add API Key to .env

Edit `backend-node/.env`:
```bash
OPENAI_API_KEY=sk-paste-your-key-here
```

### Step 3: Start the Backend

```bash
cd backend-node
npm run dev
```

You should see:
```
✅ SafeSpace Backend Server Running
📡 Server: http://localhost:5001
```

### Step 4: Start the Frontend

In a new terminal:
```bash
npm run dev
```

Browser will open at `http://localhost:5173`

### Step 5: Test the Chatbot

1. Click the 💬 icon in the bottom-right corner
2. Type a message like: "I feel stressed"
3. Watch the AI respond! 🎉

---

## 📝 Test Messages

Try these messages to see different chatbot responses:

```
✅ "Hi there" → Friendly greeting
✅ "I'm stressed about exams" → Wellness support
✅ "I feel really sad" → Mental health response
✅ "This is an emergency!" → Emergency resources
✅ "How do I use this app?" → Feature guide
✅ "Can I talk to a counselor?" → Counseling info
✅ "Show me safety features" → Navigation
```

---

## 🔧 Quick API Testing

### Test the Chatbot Endpoint

```bash
curl -X POST http://localhost:5001/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I feel stressed",
    "conversationHistory": []
  }'
```

Expected response:
```json
{
  "success": true,
  "reply": "I understand you're feeling stressed...",
  "intent": "wellness",
  "mood": "upset",
  "suggestions": ["Log your mood", "Try breathing exercises"],
  "quickActions": [...]
}
```

### Check Chatbot Status

```bash
curl http://localhost:5001/api/chatbot/health
```

Response will show if OpenAI is configured:
```json
{
  "status": "ready",
  "message": "Chatbot is ready",
  "openaiConfigured": true
}
```

---

## 🎨 UI Features

The chatbot includes:

### Floating Widget
- **Location**: Bottom-right corner of all pages
- **Icon**: Chat bubble (💬)
- **Click**: Opens/closes chat window

### Chat Window
- **Header**: SafeSpace Assistant with mood indicator
- **Messages**: User messages (blue) and AI responses (white)
- **Loading**: Animated dots while thinking
- **Suggestions**: Click-to-send quick suggestions
- **Quick Actions**: Navigate to app features
- **Input**: Type message and press Send or Enter

### Mood Indicator
Shows detected user mood:
- 😊 Positive
- 😔 Needs Support
- 😠 Frustrated
- 😕 Seeking Help
- 😐 Neutral

---

## ⚙️ How It Works

```
User Types Message
    ↓
Frontend sends to /api/chatbot
    ↓
Backend receives message
    ↓
Detects Intent (emergency, wellness, etc.)
    ↓
Detects Mood (upset, happy, confused, etc.)
    ↓
Sends to OpenAI with system prompt
    ↓
OpenAI generates empathetic response
    ↓
Backend processes and structures response
    ↓
Adds suggestions & quick actions
    ↓
Frontend displays with nice UI
    ↓
Auto-scrolls to latest message
    ↓
User sees response + suggestions
```

---

## 🆘 Emergency Detection

If user mentions:
- "help"
- "emergency"
- "danger"
- "unsafe"
- "not safe"
- "suicidal"
- "can't take it"

**Chatbot will:**
1. 🚨 Show emergency message
2. 📞 Provide emergency contact numbers
3. 🔴 Add "Emergency SOS" button
4. 📍 Direct to Safety Hub

---

## 💡 Customization Tips

### Change Welcome Message

Edit `ChatbotAssistant.tsx` line 30:
```typescript
const welcomeMessage = "Hello! 👋 ...";
```

### Change Button Position

Edit `ChatbotAssistant.tsx` line 182:
```typescript
className="fixed bottom-6 right-6"  // Change bottom/right values
```

### Change Colors

Edit Tailwind classes in `ChatbotAssistant.tsx`:
```typescript
from-blue-600 to-purple-600  // Change gradient colors
bg-blue-600  // Message background
```

### Adjust AI Behavior

Edit `chatbotController.js` - modify system prompt:
```javascript
const SYSTEM_PROMPT = `You are SafeSpace AI Assistant...`
```

---

## 📊 Response Structure

Every chatbot response includes:

```javascript
{
  success: true,
  reply: "AI's empathetic response",
  intent: "wellness|emergency|counseling|...",
  mood: "upset|happy|neutral|...",
  suggestions: ["Suggestion 1", "Suggestion 2"],
  quickActions: [
    { label: "Button Text", action: "/route" }
  ],
  timestamp: "2024-03-22T10:30:00.000Z"
}
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Chatbot not responding | Check OpenAI API key in .env |
| "API key not found" error | Restart backend after adding key |
| Response is empty | Verify OpenAI account has credits |
| CORS error | Backend CORS is enabled by default |
| Slow responses | Normal (API takes 1-3 seconds) |
| Chatbot button not visible | Check ChatbotAssistant imported in App.tsx |

---

## 📱 Responsive Design

The chatbot works on:
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)
- ✅ Any screen size

Chat window automatically:
- Scales down on small screens
- Max width: 100vw - 3rem
- Max height: 80vh
- Always stays in viewport

---

## 🔐 Safety & Privacy

✅ **Safe Implementation:**
- No personal data stored in responses
- No message history in database (yet)
- All data stays in session
- HTTPS recommended for production

⚠️ **Important:**
- Never ask for passwords
- Never provide medical diagnosis
- Always suggest professional help for serious issues
- Respect user privacy

---

## 📈 Performance

- Average response time: **1-3 seconds**
- Token usage: ~200 per message
- Cost per message: ~$0.0004
- Supports conversation context: **Last 5 messages**

---

## 🎯 Next Steps

1. ✅ Set up OpenAI API key
2. ✅ Start backend & frontend
3. ✅ Test chatbot with sample messages
4. ✅ Customize styling if needed
5. ✅ Deploy to production

For detailed setup, see [CHATBOT_SETUP_GUIDE.md](./CHATBOT_SETUP_GUIDE.md)

---

## 📞 Support Resources

- **OpenAI Docs**: https://platform.openai.com/docs
- **SafeSpace Issues**: Check GitHub issues
- **API Key Help**: https://platform.openai.com/account/api-keys
- **Pricing**: https://openai.com/pricing

---

## 🎉 You're Ready!

The chatbot is now integrated into SafeSpace and ready to help students with:
- 🚨 Emergency support
- 💚 Mental wellness
- 📚 Resources & guidance
- 🔗 Feature navigation

Enjoy! 🚀
