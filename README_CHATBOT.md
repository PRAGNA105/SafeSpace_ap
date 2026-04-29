# 🤖 Smart AI Chatbot for SafeSpace

Welcome to the Smart AI Chatbot implementation for SafeSpace! This document provides a complete overview of the chatbot feature, its capabilities, and how to use it.

## 🎯 What is the Smart AI Chatbot?

The Smart AI Chatbot is an AI-powered conversational assistant that helps SafeSpace students with:

- 🚨 **Emergency Support** - Immediate help for safety concerns
- 💚 **Mental Wellness** - Emotional support and wellness resources
- 📞 **Counseling Guidance** - Professional mental health recommendations
- 🗺️ **App Navigation** - Feature discovery and guidance
- 🤝 **General Support** - Answering questions and providing information

The chatbot uses **OpenAI's GPT-3.5-turbo** model to understand context and provide empathetic, intelligent responses.

## 🌟 Key Features

### Smart Intent Detection
Automatically identifies what the user needs:
- **Emergency** - Safety concerns or crisis situations
- **Wellness** - Mental health and stress-related issues
- **Counseling** - Professional support requests
- **Navigation** - Questions about app features
- **General** - Other inquiries

### Emotional Intelligence
Detects user mood:
- 😔 Upset (sadness, anxiety, worry)
- 😠 Frustrated (anger, complaints)
- 😊 Happy (positive emotions)
- 😕 Confused (uncertainty)
- 😐 Neutral (default state)

### Context-Aware Responses
- Maintains conversation history
- Provides relevant suggestions
- Offers quick navigation buttons
- Tailored guidance based on situation

### Emergency Protocol
When emergencies are detected:
1. Immediate safety response
2. Emergency contact numbers displayed
3. Direct link to Emergency SOS feature
4. Campus security information

### Always Available
- 24/7 accessibility
- On every page in SafeSpace
- Works on all devices
- No app installation needed

## 🚀 Getting Started

### Quick Setup (3 Steps)

1. **Get OpenAI API Key**
   ```
   Visit: https://platform.openai.com/account/api-keys
   Create and copy your API key
   ```

2. **Add to Environment**
   ```bash
   # Edit: backend-node/.env
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Start Backend**
   ```bash
   cd backend-node
   npm run dev
   ```

**That's it!** The chatbot is now live in SafeSpace.

## 📖 Full Documentation

For detailed setup and customization, see these guides:

1. **[CHATBOT_QUICK_START.md](./CHATBOT_QUICK_START.md)**
   - Quick reference for developers
   - Test messages and API testing
   - Troubleshooting tips
   - 5-minute setup

2. **[CHATBOT_SETUP_GUIDE.md](./CHATBOT_SETUP_GUIDE.md)**
   - Comprehensive setup instructions
   - API endpoint documentation
   - Customization options
   - Production deployment
   - Monitoring and logs

3. **[CHATBOT_IMPLEMENTATION_SUMMARY.md](./CHATBOT_IMPLEMENTATION_SUMMARY.md)**
   - Technical architecture
   - File structure overview
   - Implementation details
   - Data flow diagrams
   - Future enhancements

## 💬 How to Use

### For Students

1. **Click the Chat Icon**
   - Look for the💬 icon in the bottom-right corner
   - Available on all SafeSpace pages

2. **Send a Message**
   - Type naturally about what you need
   - Share how you're feeling
   - Ask questions about features

3. **Get Support**
   - Receive AI-powered responses
   - Click suggestions for more options
   - Use quick actions to navigate

4. **Examples of What to Say**
   ```
   "I feel really stressed"
   "I need help right now"
   "How do I book a counselor?"
   "Show me the Safety Hub"
   "I'm having an emergency"
   ```

### For Developers

1. **Start Backend**
   ```bash
   cd backend-node
   npm run dev
   ```

2. **Test Endpoint**
   ```bash
   curl -X POST http://localhost:5001/api/chatbot \
     -H "Content-Type: application/json" \
     -d '{"message": "Hi", "conversationHistory": []}'
   ```

3. **Check Status**
   ```bash
   curl http://localhost:5001/api/chatbot/health
   ```

## 📁 Project Structure

```
SafeSpace/
├── backend-node/
│   ├── controllers/
│   │   └── chatbotController.js          # OpenAI integration
│   ├── index.js                          # API endpoints
│   ├── .env                              # API configuration
│   └── package.json                      # Dependencies
│
├── src/
│   ├── components/
│   │   └── ChatbotAssistant.tsx          # Chat UI widget
│   └── App.tsx                           # Main app (includes chatbot)
│
├── CHATBOT_QUICK_START.md                # Quick reference
├── CHATBOT_SETUP_GUIDE.md                # Full setup guide
├── CHATBOT_IMPLEMENTATION_SUMMARY.md     # Technical details
└── README_CHATBOT.md                     # This file
```

## 🔧 API Overview

### Send Message

**Endpoint:** `POST /api/chatbot`

**Request:**
```json
{
  "message": "I feel stressed",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "success": true,
  "reply": "I understand you're feeling stressed...",
  "intent": "wellness",
  "mood": "upset",
  "suggestions": ["Log mood", "Try exercises"],
  "quickActions": [
    {"label": "Wellness Hub", "action": "/wellness"},
    {"label": "Book Counseling", "action": "/resources"}
  ],
  "timestamp": "2024-03-22T10:30:00Z"
}
```

### Check Status

**Endpoint:** `GET /api/chatbot/health`

**Response:**
```json
{
  "status": "ready",
  "message": "Chatbot is ready",
  "openaiConfigured": true
}
```

## 🎨 UI Components

### Chat Window
- **Size**: Fixed width (384px), responsive max height
- **Position**: Fixed bottom-right corner
- **Scroll**: Auto-scrolls to latest message
- **Theme**: Gradient header (blue to purple)

### Messages
- **User Messages**: Right-aligned, blue background
- **Bot Messages**: Left-aligned, white background with border
- **Icons**: User/Bot icons for clarity
- **Timestamps**: Automatic message dating

### Suggestions
- **Inline Buttons**: Click to send predefined messages
- **Visual Feedback**: Hover effects and transitions
- **Context-Aware**: Suggestions based on user's situation

### Quick Actions
- **Navigation Buttons**: Go to app features
- **Dynamic**: Changes based on detected intent
- **Safe Routes**: Links to main SafeSpace pages

## 🚨 Emergency Handling

### What Triggers Emergency Response?

Keywords detected:
```
"help"           "emergency"       "danger"
"unsafe"         "not safe"        "threat"
"suicidal thoughts"                "self-harm"
"can't take it"  "crisis"          "urgent help"
```

### Emergency Response Includes

1. **Immediate acknowledgment**
   ```
   🚨 Your safety is my priority. Please reach out for immediate help:
   ```

2. **Emergency numbers**
   ```
   • Police & Paramedics: 112
   • Ambulance: 100
   • Campus Security: 24/7
   ```

3. **Quick actions**
   - Call Emergency SOS
   - View Security Directory
   - Add Trusted Contacts

4. **Professional help links**
   - Mental health crisis lines
   - Therapy resources
   - Campus counseling services

## 🔐 Privacy & Safety

✅ **What's Protected**
- No personal data stored in responses
- Session-based conversations (not saved)
- HTTPS recommended for production
- No user tracking or profiling

⚠️ **Important Reminders**
- **Not a replacement** for professional help
- **Not for diagnosis** - recommends specialists
- **Not emergency response system** - advises calling authorities
- **Always escalate** serious issues to professionals

## 🧪 Testing

### Test Messages

```bash
# Navigation
curl -X POST http://localhost:5001/api/chatbot \
  -d '{"message": "Show me features"}'

# Wellness
curl -X POST http://localhost:5001/api/chatbot \
  -d '{"message": "I feel anxious"}'

# Emergency
curl -X POST http://localhost:5001/api/chatbot \
  -d '{"message": "This is an emergency!"}'

# Counseling
curl -X POST http://localhost:5001/api/chatbot \
  -d '{"message": "Can I talk to a counselor?"}'
```

### Test in Browser

1. Open `http://localhost:5173`
2. Click 💬 icon
3. Send: "Hi, how can you help?"
4. Verify response appears

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No response | Check OpenAI API key in .env |
| "API not configured" | Restart backend after adding key |
| Slow responses | Normal (1-3 sec), OpenAI API latency |
| Empty suggestions | Check intent detection, reload page |
| CORS error | Verify backend running on 5001 |
| Button doesn't navigate | Check route exists in App.tsx |

## 📊 Performance

- **Response Time**: 1-3 seconds
- **Token Usage**: ~200 per message
- **Cost per Message**: ~$0.0004
- **Supports**: Conversation context (last 5 messages)
- **Uptime**: Depends on OpenAI API availability

## 💰 Costs

**OpenAI Pricing:**
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- Average message: ~$0.0004

**Monthly Estimate (1000 daily users):**
- 150,000 messages/month
- ~$50/month

**You Can:**
- Set usage limits in OpenAI dashboard
- Monitor usage regularly
- Switch to cheaper model if needed

## 🔄 Deployment

### Development
```bash
npm run dev           # Terminal 1: Frontend
npm run dev           # Terminal 2: Backend (in backend-node/)
```

### Production

1. **Set Environment Variables**
   ```
   OPENAI_API_KEY=sk-prod-key
   PORT=5001
   NODE_ENV=production
   ```

2. **Update API URL** (if different domain)
   ```typescript
   // In ChatbotAssistant.tsx
   const response = await fetch('https://your-api.com/api/chatbot', {
   ```

3. **Deploy Backend**
   ```bash
   npm install
   npm start
   ```

4. **Deploy Frontend**
   ```bash
   npm run build
   npm run preview
   ```

## 📝 Customization

### Change Welcome Message
Edit `ChatbotAssistant.tsx` line 30

### Change Colors
Edit Tailwind classes in `ChatbotAssistant.tsx`

### Modify AI Behavior
Edit system prompt in `chatbotController.js`

### Add More Intents
Extend intent detection in `detectIntent()` function

### Add Custom Routes
Add to `quickActions` with new app routes

## 📚 Resources

- **[OpenAI API Docs](https://platform.openai.com/docs)** - Complete API reference
- **[GPT Models](https://platform.openai.com/docs/models)** - Available models
- **[React Documentation](https://react.dev/)** - React and Hooks
- **[Express.js](https://expressjs.com/)** - Backend framework
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling

## 🎓 Learning

### For Understanding Intent Detection
- Read: `chatbotController.js` - `detectIntent()` function
- Try: Different user messages to see classifications
- Extend: Add new intent categories

### For Understanding Mood Detection
- Read: `chatbotController.js` - `detectMood()` function
- Try: Messages with different emotional content
- Modify: Add more emotion keywords

### For Understanding Component Flow
- Read: `ChatbotAssistant.tsx` - Component structure
- Trace: `sendMessage()` → API call → State update → UI render
- Customize: Styling and layout

## 🎉 Success Indicators

Your chatbot is working well if:

- ✅ Chat icon visible on all pages
- ✅ Clicking icon opens chat window
- ✅ Can type and send messages
- ✅ Bot responds with AI text (not errors)
- ✅ Suggestions appear and are clickable
- ✅ Quick actions navigate to correct pages
- ✅ Emergency messages trigger special response
- ✅ Mood indicator updates
- ✅ Loading animation shows while processing
- ✅ Auto-scroll works on new messages

## 🚀 Next Steps

1. **Test the Chatbot**
   - Try various messages
   - Check emergency detection
   - Test navigation suggestions

2. **Customize if Needed**
   - Change colors to match brand
   - Update system prompt
   - Add custom quick actions

3. **Deploy to Production**
   - Set up environment variables
   - Configure API domain
   - Monitor usage and costs

4. **Gather Feedback**
   - User satisfaction
   - Response quality
   - Common questions asked

5. **Iterate and Improve**
   - Update system prompt based on feedback
   - Add new intents as needed
   - Optimize responses

## 📞 Support

**Quick Help:**
1. Check [CHATBOT_QUICK_START.md](./CHATBOT_QUICK_START.md)
2. Review error logs in terminal
3. Test API with curl
4. Check OpenAI dashboard for issues

**For Issues:**
- Backend logs show processing steps
- Browser DevTools show frontend errors
- OpenAI dashboard shows API status

## ✨ Summary

The Smart AI Chatbot is now **fully integrated** into SafeSpace with:
- ✅ OpenAI GPT-3.5-turbo backend
- ✅ Intent & mood detection
- ✅ Emergency handling protocol
- ✅ Responsive React UI
- ✅ 24/7 availability
- ✅ Comprehensive documentation
- ✅ Production-ready code

**Students can now receive:**
- Immediate emotional support
- Emergency guidance
- Mental wellness resources
- App feature guidance
- Professional help referrals

All from a friendly AI assistant available anytime, anywhere on SafeSpace!

---

**Version**: 1.0  
**Status**: ✅ Production Ready  
**Last Updated**: March 22, 2024  
**Support**: See documentation files above

🎉 **Happy to help your students!**
