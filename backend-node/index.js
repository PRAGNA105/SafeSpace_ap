const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();

function parseAllowedOrigins() {
  const combined = [
    process.env.FRONTEND_ORIGINS || '',
    process.env.FRONTEND_ORIGIN || '',
  ]
    .filter(Boolean)
    .join(',');

  return combined
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  if (/\.hf\.space$/i.test(origin)) return true;

  return allowedOrigins.some((allowedOrigin) => allowedOrigin.toLowerCase() === origin.toLowerCase());
}

const allowedOrigins = parseAllowedOrigins();
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin, allowedOrigins)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const ADMIN_SUPPORT_PHONE = process.env.ADMIN_SUPPORT_PHONE;

let twilioClient = null;
if (accountSid && authToken && twilioPhoneNumber) {
  twilioClient = twilio(accountSid, authToken);
  console.log('Twilio initialized successfully');
} else {
  console.log('Twilio credentials not found. Call and SMS features are disabled.');
}

async function sendSMS(to, message) {
  if (!twilioClient) {
    console.log('Twilio not configured. SMS not sent to:', to);
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to,
    });
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Failed to send SMS:', error.message);
    return { success: false, error: error.message };
  }
}

async function makePhoneCall(to, message) {
  if (!twilioClient) {
    console.log('Twilio not configured. Call not made to:', to);
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const twimlUrl = `http://twimlets.com/message?Message=${encodeURIComponent(message)}`;
    const call = await twilioClient.calls.create({
      url: twimlUrl,
      to,
      from: twilioPhoneNumber,
    });
    return { success: true, sid: call.sid, status: call.status };
  } catch (error) {
    console.error('Failed to call:', error.message);
    return { success: false, error: error.message };
  }
}

app.post('/api/emergency/call-and-sms', async (req, res) => {
  try {
    const { emergencyNumber } = req.body;
    if (!twilioClient) {
      return res.status(503).json({ success: false, message: 'Twilio not configured.', error: 'TWILIO_NOT_CONFIGURED' });
    }

    const smsMessage = `EMERGENCY ALERT\n\nEmergency SOS activated.\n\nTime: ${new Date().toLocaleString()}\n\n- SafeSpace Emergency System`;
    const voiceMessage = 'Emergency SOS alert activated. Please respond immediately.';
    const callResult = await makePhoneCall(emergencyNumber, voiceMessage);
    const smsResult = await sendSMS(emergencyNumber, smsMessage);

    if (callResult.success || smsResult.success) {
      return res.json({ success: true, message: 'Emergency alert sent successfully', call: callResult, sms: smsResult });
    }

    res.status(500).json({ success: false, message: 'Failed to send emergency alert', call: callResult, sms: smsResult });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send emergency alert', error: error.message });
  }
});

app.post('/api/emergency/notify-contacts', async (req, res) => {
  try {
    const { phoneNumbers = [], message, makeCall } = req.body;
    if (!twilioClient) {
      return res.json({ success: false, message: 'Twilio not configured', error: 'TWILIO_NOT_CONFIGURED' });
    }

    const smsMessage = message || `EMERGENCY SOS ALERT\n\nYour trusted contact needs immediate help.\n\nTime: ${new Date().toLocaleString()}\n\n- SafeSpace Emergency System`;
    const smsResults = await Promise.all(phoneNumbers.map((phone) => sendSMS(phone, smsMessage)));
    const successCount = smsResults.filter((result) => result.success).length;
    let callResult = null;

    if (makeCall && phoneNumbers.length > 0) {
      callResult = await makePhoneCall(phoneNumbers[0], 'Emergency SOS alert. Your trusted contact needs immediate help.');
    }

    res.json({ success: true, message: `${successCount}/${phoneNumbers.length} trusted contacts notified`, smsResults, callResult });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to notify contacts', error: error.message });
  }
});

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || process.env.SARVAM_API_SUBSCRIPTION_KEY;
const SARVAM_BASE_URL = process.env.SARVAM_BASE_URL || 'https://api.sarvam.ai';
const SARVAM_CHAT_MODEL = process.env.SARVAM_CHAT_MODEL || 'sarvam-30b';
const SARVAM_TTS_SPEAKER = process.env.SARVAM_TTS_SPEAKER || 'priya';
const supportAlerts = [];

const ttsLanguages = new Set(['en-IN', 'hi-IN', 'bn-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN']);
const sarvamTranslateLanguages = new Set([
  'as-IN', 'bn-IN', 'brx-IN', 'doi-IN', 'en-IN', 'gu-IN', 'hi-IN', 'kn-IN',
  'ks-IN', 'kok-IN', 'mai-IN', 'ml-IN', 'mni-IN', 'mr-IN', 'ne-IN', 'od-IN',
  'pa-IN', 'sa-IN', 'sat-IN', 'sd-IN', 'ta-IN', 'te-IN', 'ur-IN'
]);

function sarvamHeaders(contentType) {
  const headers = {
    'api-subscription-key': SARVAM_API_KEY,
    Authorization: `Bearer ${SARVAM_API_KEY}`,
  };
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
}

function normalizeSarvamError(errorPayload) {
  if (!errorPayload) return 'Sarvam API request failed';
  if (typeof errorPayload === 'string') return errorPayload;
  return errorPayload?.error?.message || errorPayload?.message || JSON.stringify(errorPayload);
}

async function sarvamJson(path, payload) {
  if (!SARVAM_API_KEY) throw new Error('SARVAM_API_KEY is not configured');

  const response = await fetch(`${SARVAM_BASE_URL}${path}`, {
    method: 'POST',
    headers: sarvamHeaders('application/json'),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(normalizeSarvamError(data));
  return data;
}

function detectLanguageLocally(text) {
  if (!text) return null;
  if (/[\u0980-\u09FF]/.test(text)) return { language: 'bn-IN', script: 'Beng' };
  if (/[\u0A00-\u0A7F]/.test(text)) return { language: 'pa-IN', script: 'Guru' };
  if (/[\u0A80-\u0AFF]/.test(text)) return { language: 'gu-IN', script: 'Gujr' };
  if (/[\u0B00-\u0B7F]/.test(text)) return { language: 'od-IN', script: 'Orya' };
  if (/[\u0B80-\u0BFF]/.test(text)) return { language: 'ta-IN', script: 'Taml' };
  if (/[\u0C00-\u0C7F]/.test(text)) return { language: 'te-IN', script: 'Telu' };
  if (/[\u0C80-\u0CFF]/.test(text)) return { language: 'kn-IN', script: 'Knda' };
  if (/[\u0D00-\u0D7F]/.test(text)) return { language: 'ml-IN', script: 'Mlym' };
  if (/[\u0600-\u06FF]/.test(text)) return { language: 'ur-IN', script: 'Arab' };
  if (/[\uABC0-\uABFF]/.test(text)) return { language: 'mni-IN', script: 'Mtei' };
  return null;
}

async function detectTextLanguage(text) {
  if (!text) return { language: 'en-IN', script: 'Latn' };

  try {
    if (SARVAM_API_KEY) {
      const data = await sarvamJson('/text-lid', { input: text.slice(0, 1000) });
      if (data?.language_code) {
        return { language: data.language_code, script: data?.script_code || null };
      }
    }
  } catch (error) {
    console.warn('Language detection failed:', error.message);
  }

  const localDetection = detectLanguageLocally(text);
  if (localDetection) return localDetection;
  if (/[\u0900-\u097F]/.test(text)) return { language: 'hi-IN', script: 'Deva' };
  return { language: 'en-IN', script: 'Latn' };
}

async function translateText(input, targetLanguage, sourceLanguage = 'en-IN') {
  if (!SARVAM_API_KEY || !input || targetLanguage === sourceLanguage || !sarvamTranslateLanguages.has(targetLanguage)) {
    return input;
  }

  try {
    // Sarvam's text translation endpoint is /translate, not /v1/translate.
    const data = await sarvamJson('/translate', {
      input: input.slice(0, 2000),
      source_language_code: sourceLanguage,
      target_language_code: targetLanguage,
      model: 'sarvam-translate:v1',
    });
    return data?.translated_text || input;
  } catch (error) {
    console.warn('Translation failed:', error.message);
    return input;
  }
}

async function translateForInternalAnalysis(text, language) {
  if (!text || language === 'en-IN') return text;
  return translateText(text, 'en-IN', sarvamTranslateLanguages.has(language) ? language : 'auto');
}

async function transcribeAudio({ audioBase64, audioMimeType, filename }) {
  if (!audioBase64) return null;
  if (!SARVAM_API_KEY) throw new Error('Voice input needs SARVAM_API_KEY in backend-node/.env');

  const buffer = Buffer.from(audioBase64, 'base64');
  const mimeType = (audioMimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';
  const extension = mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'webm';
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: mimeType }), filename || `student-audio.${extension}`);
  formData.append('model', 'saaras:v3');
  formData.append('mode', 'transcribe');
  formData.append('language_code', 'unknown');

  const response = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
    method: 'POST',
    headers: sarvamHeaders(),
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(normalizeSarvamError(data));

  const transcript = data?.transcript || '';
  return {
    transcript,
    language: data?.language_code || detectLanguageLocally(transcript)?.language || 'en-IN',
    languageProbability: data?.language_probability ?? null,
  };
}

function keywordRiskClassifier(text) {
  const lower = (text || '').toLowerCase();
  const tier3 = [
    'kill myself', 'end my life', 'suicide plan', 'i have a plan', 'overdose now',
    'jump off', 'hang myself', 'i am going to die', 'hurt myself now', 'tonight i will',
    'i will kill', 'immediate danger'
  ];
  const tier2 = [
    'suicide', 'self harm', 'self-harm', 'hopeless', 'cannot go on', 'cant go on',
    'unsafe at home', 'abuse', 'assault', 'molested', 'panic attack', 'severe depression', 'major depression',
    'want to disappear', 'no reason to live', 'worthless', 'trapped'
  ];
  const tier1 = [
    'stress', 'stressed', 'anxious', 'anxiety', 'lonely', 'sad', 'depressed', 'depression',
    'exam pressure', 'overwhelmed', 'crying', 'not okay', 'not fine', 'scared',
    'pressure', 'afraid', 'fear', 'worried', 'nervous', 'test tomorrow', 'test', 'exam tomorrow', 'quiz marks', 'bully', 'bullied', 'bullying', 'friends do not love', "friends don't love", 'ignored', 'rejected', 'left out', 'brain is not okay', 'mind is not okay', 'something feels wrong'
  ];

  if (tier3.some((phrase) => lower.includes(phrase))) return 3;
  if (tier2.some((phrase) => lower.includes(phrase))) return 2;
  if (tier1.some((phrase) => lower.includes(phrase))) return 1;
  return 0;
}

async function modelRiskClassifier(text, language) {
  if (!SARVAM_API_KEY || !text) return { tier: 0, confidence: 0, reason: 'model classifier unavailable' };

  try {
    const data = await sarvamJson('/v1/chat/completions', {
      model: SARVAM_CHAT_MODEL,
      temperature: 0,
      max_tokens: 220,
      messages: [
        { role: 'system', content: 'Classify this student support message into exactly one tier: 0 no concern, 1 mild distress, 2 serious concern, 3 possible imminent danger. Return only JSON with keys tier, confidence, reason, recommendedAction.' },
        { role: 'user', content: `Student language: ${language}\nEnglish meaning: ${text}` },
      ],
    });

    const raw = data?.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return {
      tier: Math.max(0, Math.min(3, Number(parsed.tier) || 0)),
      confidence: Number(parsed.confidence) || 0,
      reason: String(parsed.reason || 'No reason provided').slice(0, 220),
      recommendedAction: String(parsed.recommendedAction || '').slice(0, 220),
    };
  } catch (error) {
    console.warn('Model risk classifier failed:', error.message);
    return { tier: 0, confidence: 0, reason: 'model classifier failed' };
  }
}

async function classifyRisk(internalText, language) {
  const keywordTier = keywordRiskClassifier(internalText);
  const modelSignal = await modelRiskClassifier(internalText, language);
  const tier = Math.max(keywordTier, modelSignal.tier || 0);
  const labels = ['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3'];

  return {
    tier,
    riskLevel: labels[tier],
    source: keywordTier >= modelSignal.tier ? 'keyword_guardrail' : 'model_plus_guardrail',
    confidence: modelSignal.confidence,
    reason: modelSignal.reason,
    recommendedAction: tier === 3
      ? 'Priority alert to human responders immediately. Show crisis guidance.'
      : tier === 2
        ? 'Contact student support team within 15 minutes.'
        : tier === 1
          ? 'Offer supportive response and optional counselor booking.'
          : 'Continue normal support chat.',
  };
}

function moodFromTier(tier) {
  return tier >= 1 ? 'upset' : 'neutral';
}

function buildQuickActions(riskTier) {
  if (riskTier >= 3) {
    return [
      { label: 'Emergency Help', action: '/security' },
      { label: 'Safety Hub', action: '/safety' },
      { label: 'Book Counselor', action: '/resources' },
    ];
  }
  if (riskTier >= 2) {
    return [
      { label: 'Book Counselor', action: '/resources' },
      { label: 'Crisis Contacts', action: '/security' },
      { label: 'Wellness Hub', action: '/wellness' },
    ];
  }
  if (riskTier === 1) {
    return [
      { label: 'Wellness Hub', action: '/wellness' },
      { label: 'Book Counselor', action: '/resources' },
      { label: 'Self-Help Guides', action: '/self_guidance' },
    ];
  }
  return [
    { label: 'Safety Hub', action: '/safety' },
    { label: 'Wellness Hub', action: '/wellness' },
    { label: 'Resources', action: '/resources' },
  ];
}

function buildSuggestions(riskTier) {
  if (riskTier >= 3) return ['I can stay here while you get help', 'Show emergency contacts', 'Book counselor support'];
  if (riskTier >= 2) return ['I want to book a counselor', 'Show crisis support', 'Help me calm down'];
  if (riskTier === 1) return ['Try a grounding exercise', 'I want to talk to someone', 'Show wellness tools'];
  return ['I need wellness support', 'How can I book a counselor?', 'Show safety features'];
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

async function localizeSuggestions(suggestions, language) {
  if (language === 'en-IN' || !sarvamTranslateLanguages.has(language)) return suggestions;
  return Promise.all(suggestions.map((suggestion) => translateText(suggestion, language, 'en-IN')));
}

async function localizeQuickActions(actions, language) {
  if (language === 'en-IN' || !sarvamTranslateLanguages.has(language)) return actions;
  const labels = await Promise.all(actions.map((action) => translateText(action.label, language, 'en-IN')));
  return actions.map((action, index) => ({ ...action, label: labels[index] || action.label }));
}

async function createSupportAlert({ studentId, language, source, transcript, internalText, risk }) {
  const alert = {
    id: `alert-${Date.now()}`,
    studentId: studentId || 'anonymous',
    riskLevel: risk.riskLevel,
    language,
    source,
    transcript: transcript.slice(0, 1200),
    internalText: internalText.slice(0, 1200),
    summary: risk.reason || 'Student-support signal detected.',
    recommendedAction: risk.recommendedAction,
    createdAt: new Date().toISOString(),
  };

  supportAlerts.unshift(alert);
  supportAlerts.splice(50);

  if (ADMIN_SUPPORT_PHONE && twilioClient) {
    const sms = `SafeSpace ${alert.riskLevel} alert\nStudent: ${alert.studentId}\nLang: ${alert.language}\nAction: ${alert.recommendedAction}\nSummary: ${alert.summary}`;
    await sendSMS(ADMIN_SUPPORT_PHONE, sms.slice(0, 1500));
  }

  return alert;
}

function baseFallbackReply(internalText, riskTier) {
  const lower = (internalText || '').toLowerCase();

  const normalizedGreeting = lower.trim().replace(/[!.?]+$/g, '');
  const isSimpleGreeting = ['hi', 'hii', 'hello', 'hey', 'hi anira', 'hello anira', 'hey anira', 'namaste', 'नमस्ते', 'हॅलो', 'హలో', 'வணக்கம்', 'ನಮಸ್ಕಾರ'].includes(normalizedGreeting);
  const isNameQuestion = lower.includes('name') || lower.includes('who are you') || lower.includes('your name');
  if (isSimpleGreeting || isNameQuestion) {
    return 'Hi, I am Anira. I am here to help with exam pressure, stress, safety concerns, counselor booking, or anything you want to talk through. How can I help you today?';
  }

  if (includesAny(lower, ['show safety features', 'safety features', 'safety hub', 'safety options'])) {
    return 'Here are the main safety features I can help you with: open the Safety Hub, see crisis or emergency contacts, review trusted-contact tools, and reach counselor support if the situation feels emotionally heavy too. If this is urgent or you feel unsafe right now, please use emergency help first.';
  }

  if (includesAny(lower, ['resource', 'resources', 'wellness hub', 'show wellness tools'])) {
    return 'I can guide you to the right place. Wellness Hub is good for calming exercises and self-help tools, Resources helps with counselor booking and support information, and Safety Hub is best when you feel unsafe or need emergency options.';
  }

  if ((lower.includes('book') && lower.includes('counsel')) || includesAny(lower, ['how can i book a counselor', 'counselor booking', 'counsellor', 'counsellor booking'])) {
    return 'You can book a counselor from Resources. Open Resources, choose counselor support, pick the earliest suitable slot, and submit the booking. If what you are facing feels urgent, please also reach out to a trusted person or campus support now instead of waiting only for the appointment.';
  }

  if (lower.includes('grounding') || lower.includes('calm down') || lower.includes('breathing')) {
    return 'Let us do one quick grounding exercise together. Put both feet on the floor. Now name 5 things you can see, 4 things you can feel, 3 things you can hear, 2 things you can smell, and 1 slow breath you can take. You do not need to fix everything right now. Just come back to this moment first.';
  }

  if (includesAny(lower, ['not feeling well', 'not feeling weel', 'unwell', 'feeling sick', 'i am sick', "i'm sick"])) {
    return 'I am sorry you are not feeling well. If this seems like a physical health issue, please rest, drink water, and contact a doctor, campus clinic, or a trusted adult if symptoms are getting worse. If you want, tell me whether this is more about your body, your mood, or stress, and I will help with the next step.';
  }

  if (includesAny(lower, ['fever', 'temperature', 'high temperature', 'body pain', 'chills'])) {
    return 'Fever can be a sign that your body needs rest and medical attention. Please rest, drink fluids, and check your temperature if you can. If the fever is high, lasts more than a day or two, or comes with breathing trouble, confusion, chest pain, dehydration, or severe weakness, contact a doctor or campus clinic as soon as possible. I can also help you find support resources while you recover.';
  }

  if (includesAny(lower, ['depression', 'depressed', 'feeling depressed', 'i feel depressed'])) {
    return 'I am really sorry this feels so heavy. Depression can make everyday things feel exhausting, and you do not have to carry it alone. The best next step is to talk to a counselor or another trusted adult soon. If you want, tell me whether you need help calming down right now, putting feelings into words, or booking counselor support. If you might hurt yourself, please contact emergency help or a trusted person nearby right now.';
  }

  if (lower.includes('bully') || lower.includes('bullied') || lower.includes('bullying') || lower.includes('harass') || lower.includes('tease me')) {
    return 'I am sorry they are treating you that way. Bullying is not your fault, and you do not have to handle it alone. First, try to stay near a trusted classmate, teacher, warden, or staff member if you feel unsafe. Second, write down what happened, when, where, and who was involved. Third, consider reporting it to student support or booking a counselor so someone can help you plan what to do next. Are you safe right now?';
  }

  if (lower.includes('friends') || lower.includes('friend') || lower.includes('do not love') || lower.includes("don't love") || lower.includes('ignored') || lower.includes('left out') || lower.includes('rejected')) {
    return 'That can really hurt, especially when it comes from friends. It does not mean you are unlovable. For now, try one small step: message one person you trust and say, “I have been feeling left out lately. Can we talk?” If that feels too hard, write what happened in a note first. Also notice whether this is a misunderstanding, a repeated pattern, or someone being unkind. I can help you decide what to say to them.';
  }

  if (lower.includes('brain') || lower.includes('mind') || lower.includes('something feels wrong') || lower.includes('feels strange') || lower.includes('not feeling like myself') || lower.includes('confused')) {
    return 'That sounds unsettling. Let us slow it down. First, take a sip of water and place your feet on the floor. Then check: did this feeling start after stress, lack of sleep, conflict, or a scary thought? If you feel unsafe, out of control, or like you might hurt yourself, please contact a trusted person or emergency support immediately. If it is not immediate danger, tell me what the feeling is like: heavy, numb, racing thoughts, fear, or sadness?';
  }

  if (lower.includes('book') && lower.includes('counsel')) {
    return 'I can help with that. You can book a counselor from Resources. If this feels urgent, choose the earliest slot and also contact campus support or a trusted person now.';
  }

  if (lower.includes('wellness tool') || lower.includes('wellness support')) {
    return 'Here are gentle options that may help right now: try a grounding exercise, write what happened in your mood journal, or book a counselor if you want a human to support you. If you tell me what happened today, I can suggest a more specific next step.';
  }

  if (lower.includes('quiz') || lower.includes('marks') || lower.includes('exam') || lower.includes('test')) {
    return 'Exam pressure can feel intense, especially the day before. For the next ten minutes, do this: drink water, take three slow breaths, list the top three topics most likely to appear, and start with only one. You do not need to master everything tonight; you need a calm, realistic plan. What subject is tomorrow?';
  }

  if (lower.includes('pressure') || lower.includes('stressed') || lower.includes('stress') || lower.includes('nervous') || lower.includes('worried') || lower.includes('afraid') || lower.includes('fear')) {
    return 'I hear that you are under pressure. Let us make it smaller. Pick one: is this pressure from studies, family, friends, health, or something else? While you think, try this quick reset: relax your shoulders, breathe in for 4 seconds, breathe out for 6 seconds, and name the one thing that needs attention first. I can help you make a plan from there.';
  }

  if (lower.includes('bad at understanding') || lower.includes('not understand')) {
    return 'You are right to call that out. I should respond to what you actually need, not repeat generic support lines. Tell me what you wanted from the last answer: calming help, study help, counselor booking, or just someone to listen.';
  }

  if (riskTier >= 3) {
    return 'I am really sorry you are facing this. You deserve immediate human support. If you might hurt yourself or someone else, please contact local emergency services now or ask a trusted person nearby to stay with you. I can also open emergency contacts or counselor support.';
  }
  if (riskTier >= 2) {
    return 'I am sorry you are dealing with this. This sounds important, and you deserve support from a real person. I can help you book a counselor now, and support staff may follow up so you are not handling this alone.';
  }
  if (riskTier === 1) {
    return 'I am sorry this feels heavy. Let us make it practical: what happened, how long has it been going on, and what would help most right now: calming down, deciding what to say, planning studies, or talking to a counselor?';
  }
  return 'I am listening. Tell me a little more about what is happening, and I will help you choose the next step.';
}
async function fallbackReply(internalText, riskTier, language = 'en-IN') {
  const fallback = baseFallbackReply(internalText, riskTier);
  return translateText(fallback, language, 'en-IN');
}

async function generateStudentReply({ text, internalText, language, conversationHistory, risk }) {
  if (!SARVAM_API_KEY) return fallbackReply(internalText, risk.tier, language);

  const safetyInstruction = risk.tier >= 3
    ? 'The student may be in imminent danger. Be calm and direct. Encourage immediate local emergency help and trusted human contact. Do not over-promise confidentiality.'
    : risk.tier >= 2
      ? 'The student may need urgent support. Be warm, encourage counselor booking, and mention that support staff may reach out because it sounds important.'
      : risk.tier === 1
        ? 'The student may be distressed. Be supportive and offer practical options.'
        : 'Have a normal helpful SafeSpace support conversation.';

  const recentHistory = (conversationHistory || [])
    .slice(-6)
    .filter((item) => item?.text)
    .map((item) => ({ role: item.sender === 'bot' ? 'assistant' : 'user', content: String(item.text).slice(0, 800) }));

  try {
    const data = await sarvamJson('/v1/chat/completions', {
      model: SARVAM_CHAT_MODEL,
      temperature: 0.35,
      max_tokens: 450,
      messages: [
        {
          role: 'system',
          content: `You are Anira, a warm multilingual student-support chatbot for SafeSpace. Reply only in ${language}. Do not mention translation, English meaning, internal text, or language codes. If the student greets you or asks your name, say you are Anira and ask how you can help. Provide emotional support and practical next steps. Never diagnose. Never claim to be emergency services. ${safetyInstruction}`,
        },
        ...recentHistory,
        { role: 'user', content: `Student message: ${text}\nPrivate context for you only, do not quote or mention it: ${internalText || text}` },
      ],
    });

    return data?.choices?.[0]?.message?.content?.trim() || await fallbackReply(internalText, risk.tier, language);
  } catch (error) {
    console.warn('Chat generation failed:', error.message);
    return fallbackReply(internalText, risk.tier, language);
  }
}

async function synthesizeSpeech(text, language) {
  if (!SARVAM_API_KEY || !text) return null;
  const targetLanguageCode = ttsLanguages.has(language) ? language : 'en-IN';

  try {
    const data = await sarvamJson('/text-to-speech', {
      text: text.slice(0, 2400),
      target_language_code: targetLanguageCode,
      model: 'bulbul:v3',
      speaker: SARVAM_TTS_SPEAKER,
      pace: 0.95,
      output_audio_codec: 'wav',
    });

    return { audioBase64: data?.audios?.[0] || null, mimeType: 'audio/wav', language: targetLanguageCode };
  } catch (error) {
    console.warn('TTS failed:', error.message);
    return null;
  }
}

app.post('/api/chatbot', async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      audioBase64,
      audioMimeType,
      audioFilename,
      source,
      studentId,
    } = req.body;

    const voiceResult = audioBase64
      ? await transcribeAudio({ audioBase64, audioMimeType, filename: audioFilename })
      : null;
    const transcript = (voiceResult?.transcript || message || '').trim();

    if (!transcript) {
      return res.status(400).json({ success: false, message: 'Message or audio is required.' });
    }

    const detected = voiceResult
      ? { language: voiceResult.language || detectLanguageLocally(transcript)?.language || 'en-IN', script: null }
      : await detectTextLanguage(transcript);
    const language = detected.language || 'en-IN';
    const inputSource = source || (audioBase64 ? 'voice' : 'text');
    const internalText = await translateForInternalAnalysis(transcript, language);
    const risk = await classifyRisk(internalText, language);
    const alert = risk.tier >= 2
      ? await createSupportAlert({ studentId, language, source: inputSource, transcript, internalText, risk })
      : null;
    const reply = await generateStudentReply({ text: transcript, internalText, language, conversationHistory, risk });
    const audio = await synthesizeSpeech(reply, language);
    const suggestions = await localizeSuggestions(buildSuggestions(risk.tier), language);
    const quickActions = await localizeQuickActions(buildQuickActions(risk.tier), language);

    res.json({
      success: true,
      reply,
      transcript,
      internalText,
      language,
      script: detected.script || null,
      source: inputSource,
      risk,
      alertCreated: Boolean(alert),
      alert,
      audio,
      intent: risk.tier >= 2 ? 'support_escalation' : risk.tier === 1 ? 'wellness' : 'general',
      mood: moodFromTier(risk.tier),
      suggestions,
      quickActions,
      sarvamConfigured: Boolean(SARVAM_API_KEY),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      reply: 'Sorry, I am having trouble connecting right now. Please try again in a moment.',
      intent: 'error',
      mood: 'neutral',
      error: error.message,
    });
  }
});

app.get('/api/chatbot/alerts', (req, res) => {
  res.json({ success: true, alerts: supportAlerts });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SafeSpace Backend is running',
    twilioConfigured: !!twilioClient,
    sarvamConfigured: Boolean(SARVAM_API_KEY),
    timestamp: new Date().toISOString(),
    features: {
      emergencyCallAndSMS: twilioClient ? 'enabled' : 'disabled (needs Twilio)',
      multilingualChatbot: SARVAM_API_KEY ? 'enabled' : 'fallback only (needs Sarvam)',
    },
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'SafeSpace Emergency and Student Support API',
    version: '4.0.0',
    endpoints: {
      chatbot: 'POST /api/chatbot',
      chatbotAlerts: 'GET /api/chatbot/alerts',
      emergencyCallAndSMS: 'POST /api/emergency/call-and-sms',
      notifyTrustedContacts: 'POST /api/emergency/notify-contacts',
      health: 'GET /api/health',
    },
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`SafeSpace backend running on port ${PORT}`);
  console.log(`Allowed frontend origins: ${allowedOrigins.length ? allowedOrigins.join(', ') : 'localhost + vercel previews'}`);
  console.log(`Sarvam: ${SARVAM_API_KEY ? 'enabled' : 'disabled'}`);
  console.log(`Twilio: ${twilioClient ? 'enabled' : 'disabled'}`);
});
