import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bot, Loader2, MessageCircle, Mic, Send, ShieldCheck, Square, User, Volume2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  source?: 'text' | 'voice';
  transcript?: string;
  audioUrl?: string;
  riskLevel?: string;
  alertCreated?: boolean;
  suggestions?: string[];
  quickActions?: Array<{ label: string; action: string }>;
}

interface ChatbotResponse {
  success: boolean;
  reply: string;
  transcript?: string;
  language?: string;
  source?: 'text' | 'voice';
  risk?: {
    tier: number;
    riskLevel: string;
    recommendedAction?: string;
  };
  alertCreated?: boolean;
  audio?: {
    audioBase64: string | null;
    mimeType: string;
    language: string;
  } | null;
  mood: 'happy' | 'neutral' | 'upset' | 'frustrated' | 'confused';
  suggestions?: string[];
  quickActions?: Array<{ label: string; action: string }>;
  sarvamConfigured?: boolean;
  error?: string;
}

const CHATBOT_API_URL =
  import.meta.env.VITE_CHATBOT_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5001/api/chatbot' : '');

function audioToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildAudioUrl(audio?: ChatbotResponse['audio']) {
  if (!audio?.audioBase64) return undefined;
  return `data:${audio.mimeType || 'audio/wav'};base64,${audio.audioBase64}`;
}

export default function ChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hi, I am Anira. I am here to help with exam pressure, stress, safety concerns, counselor booking, or health and wellness worries. You can type or speak to me, and I will reply in your language. How can I help today?',
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ['I need wellness support', 'How can I book a counselor?', 'Show safety features'],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentMood, setCurrentMood] = useState<'happy' | 'neutral' | 'upset' | 'frustrated' | 'confused'>('neutral');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submitToChatbot = async ({ text, audioBlob }: { text?: string; audioBlob?: Blob }) => {
    if (!text?.trim() && !audioBlob) return;

    if (!CHATBOT_API_URL) {
      toast.error('Chatbot is not configured', {
        description: 'Set VITE_CHATBOT_API_URL to your deployed chatbot service.',
      });
      return;
    }

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      text: text?.trim() || 'Voice message',
      sender: 'user',
      timestamp: new Date(),
      source: audioBlob ? 'voice' : 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const audioBase64 = audioBlob ? await audioToBase64(audioBlob) : undefined;
      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text?.trim(),
          audioBase64,
          audioMimeType: audioBlob?.type?.split(';')[0] || 'audio/webm',
          source: audioBlob ? 'voice' : 'text',
          studentId: localStorage.getItem('studentId') || localStorage.getItem('userId') || 'anonymous',
          conversationHistory: messages.slice(-8).map((message) => ({
            text: message.transcript || message.text,
            sender: message.sender,
          })),
        }),
      });

      const data: ChatbotResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get chatbot response');
      }

      setCurrentMood(data.mood || 'neutral');

      if (audioBlob && data.transcript) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === userMessage.id
              ? { ...message, text: data.transcript || message.text, transcript: data.transcript }
              : message,
          ),
        );
      }

      const botMessage: Message = {
        id: `${Date.now()}-bot`,
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
        audioUrl: buildAudioUrl(data.audio),
        riskLevel: data.risk?.riskLevel,
        alertCreated: data.alertCreated,
        suggestions: data.suggestions,
        quickActions: data.quickActions,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (!data.sarvamConfigured) {
        toast.warning('Sarvam key missing', {
          description: 'Text fallback is active. Add SARVAM_API_KEY to backend-node/.env for multilingual voice and audio replies.',
        });
      }

      if (data.alertCreated) {
        toast.warning('Support alert created', {
          description: 'A serious support signal was detected and logged for human follow-up.',
        });
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('Chatbot connection failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          text: 'Sorry, I am having trouble connecting right now. Please try again in a moment.',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined;
      const recorder = new MediaRecorder(stream, preferredMimeType ? { mimeType: preferredMimeType } : undefined);
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: (recorder.mimeType || 'audio/webm').split(';')[0] });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        submitToChatbot({ audioBlob });
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Microphone unavailable', {
        description: 'Please allow microphone access or send a text message.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleQuickAction = (action: string) => {
    setIsOpen(false);
    navigate(action);
  };


  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-teal-700 p-4 text-white shadow-lg transition-all hover:scale-105 hover:bg-teal-800"
        aria-label="Open chat assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] shadow-2xl">
      <Card className="flex h-[640px] max-h-[84vh] flex-col overflow-hidden bg-white">
        <CardHeader className="border-b bg-slate-950 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-300" />
              <CardTitle className="truncate text-lg">Anira</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/15">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge className="border-teal-300/40 bg-teal-300/15 text-teal-100">Text + voice</Badge>
            <Badge className="border-sky-300/40 bg-sky-300/15 text-sky-100">Same language reply</Badge>
            <Badge className="border-amber-300/40 bg-amber-300/15 text-amber-100">Support triage</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
          {messages.map((message) => (
            <div key={message.id} className={message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={`max-w-[86%] rounded-lg border p-3 ${message.sender === 'user' ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                <div className="flex items-start gap-2">
                  {message.sender === 'bot' ? <Bot className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-700" /> : <User className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>

                    {message.alertCreated && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">
                          <AlertTriangle className="mr-1 h-3 w-3" /> Support staff may follow up
                        </Badge>
                      </div>
                    )}

                    {message.audioUrl && (
                      <audio controls src={message.audioUrl} className="h-9 w-full" aria-label="Spoken chatbot reply" />
                    )}

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {message.suggestions.map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => submitToChatbot({ text: suggestion })}
                            disabled={isLoading}
                            className="h-auto border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}

                    {message.quickActions && message.quickActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {message.quickActions.map((action) => (
                          <Button key={action.action} size="sm" onClick={() => handleQuickAction(action.action)} className="h-auto bg-slate-900 px-2 py-1 text-xs hover:bg-slate-800">
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
                Anira is listening...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t bg-white p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitToChatbot({ text: inputMessage });
            }}
            className="flex items-center gap-2"
          >
            <Button
              type="button"
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              aria-label={isRecording ? 'Stop recording' : 'Start voice message'}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              placeholder={isRecording ? 'Recording...' : 'Type your message'}
              disabled={isLoading || isRecording}
              className="min-w-0 flex-1"
            />
            <Button type="submit" disabled={isLoading || isRecording || !inputMessage.trim()} className="bg-teal-700 hover:bg-teal-800">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Volume2 className="h-3.5 w-3.5" />
            Replies include playable audio when Sarvam is configured.
          </div>
        </div>
      </Card>
    </div>
  );
}
