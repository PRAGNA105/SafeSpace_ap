# Deployment Guide

This project has three deployable parts:

1. Frontend: Vite/React app in the repo root
2. PHP API: `backend/`
3. Chatbot service: `backend-node/`

## Recommended hosting split

- Frontend: Vercel, Netlify, Cloudflare Pages, or any static host
- PHP API: shared hosting/cPanel, Apache, Nginx + PHP-FPM, or a VPS
- Chatbot service: Render, Railway, Fly.io, VPS, or any Node host

This repository is now prepared for:

- Frontend on Vercel with [vercel.json](./vercel.json)
- Chatbot on Render with [render.yaml](./render.yaml)
- PHP API on Hostinger/cPanel with [backend/.env.hostinger.example](./backend/.env.hostinger.example)

## Frontend deployment

Build command:

```bash
pnpm run build
```

Publish directory:

```bash
dist
```

Required frontend environment variables:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_API_URL=https://api.yourdomain.com/api
VITE_CHATBOT_API_URL=https://chat.yourdomain.com/api/chatbot
VITE_GROQ_API_KEY=your-groq-api-key
```

Important:

- `VITE_API_URL` must point to the hosted PHP API `api` directory
- `VITE_CHATBOT_API_URL` must point to the Node chatbot endpoint
- Google OAuth must include your production domain in its allowed origins
- Vercel routing for React Router is handled by `vercel.json`

Example production values:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_CHATBOT_API_URL=https://safespace-chatbot.onrender.com/api/chatbot
```

## PHP API deployment

Deploy the contents of `backend/` to a PHP-capable server.

Minimum steps:

1. Create the MySQL database.
2. Import `backend/database/init.sql`.
3. Copy `backend/.env.hostinger.example` to `backend/.env` on the server and fill in the real values.
4. Make sure the API is reachable at a URL such as `https://api.yourdomain.com/api/auth.php`.
5. Configure CORS for your frontend domain if needed.

Suggested Hostinger layout:

- Domain or subdomain document root -> contents of `backend/`
- Example API URL -> `https://api.yourdomain.com/api/auth.php`

The PHP backend now accepts:

- `SAFESPACE_FRONTEND_ORIGIN`
- `SAFESPACE_FRONTEND_ORIGINS`
- `SAFESPACE_DB_HOST`
- `SAFESPACE_DB_PORT`
- `SAFESPACE_DB_NAME`
- `SAFESPACE_DB_USER`
- `SAFESPACE_DB_PASS`
- `SAFESPACE_DB_CA`

For development, the project expects the PHP server on port `8000`. In production, the frontend now requires an explicit `VITE_API_URL`.

## Chatbot service deployment

Deploy `backend-node/` as a Node service.

Start command:

```bash
npm start
```

The service exposes:

```text
/api/chatbot
```

Use the included `render.yaml` or create the service manually in Render:

- Root directory: `backend-node`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Set the environment variables from `backend-node/.env.render.example` on Render. If audio replies are needed, make sure the Sarvam-related keys are present there.

The chatbot now accepts:

- `FRONTEND_ORIGIN`
- `FRONTEND_ORIGINS`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ADMIN_SUPPORT_PHONE`
- `SARVAM_API_KEY`
- `SARVAM_API_SUBSCRIPTION_KEY`
- `SARVAM_BASE_URL`
- `SARVAM_CHAT_MODEL`
- `SARVAM_TTS_SPEAKER`

## Deployment order

1. Deploy `backend/` to Hostinger and confirm `https://your-api-domain/api/health.php` works.
2. Deploy `backend-node/` to Render and confirm `/api/health` works.
3. Add the production URLs to Vercel environment variables.
4. Deploy the frontend to Vercel.
5. Add the final Vercel domain to Google OAuth allowed origins and to both backend origin allowlists.

## Local verification

Frontend:

```bash
pnpm run build
pnpm run preview
```

PHP API:

```bash
cd backend
php -S localhost:8000
```

Chatbot:

```bash
cd backend-node
npm start
```

## Current limitation

This repo cannot be fully deployed from this workspace alone unless the target hosting platform, credentials, and environment variables are available. The codebase is now prepared so the frontend will fail clearly when production API URLs are missing instead of silently calling `localhost`.
