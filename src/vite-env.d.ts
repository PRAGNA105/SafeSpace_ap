/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORS_API_KEY: string;
  /** Base URL for PHP API (e.g. http://localhost:8000/api) */
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  /** Full chatbot endpoint (e.g. https://chat.example.com/api/chatbot) */
  readonly VITE_CHATBOT_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Groq API key for prescription OCR */
  readonly VITE_GROQ_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
