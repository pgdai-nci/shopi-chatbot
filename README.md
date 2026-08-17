# Shopi Ecommerce Chatbot

A free, open-source shopping assistant chatbot for Shopify stores. Runs on GitHub Pages with a Cloudflare Worker proxy to keep the API key secure.

## Features

- AI-powered product recommendations via Google Gemini
- Streaming responses with real-time text display
- Product cards with images, prices, and direct links
- Conversation history persisted in localStorage
- Mobile-responsive: full-screen panel on phones, floating panel on desktop
- Accessible: keyboard navigation, screen reader support, focus management
- Re-skinable via CSS custom properties
- No frameworks, no build tools — pure vanilla JS
- API key secured via Cloudflare Worker proxy (never exposed to browser)

## Architecture

```
Browser (GitHub Pages)  →  Cloudflare Worker  →  Gemini API
     chat.js                 shopi-proxy          generativelanguage
     gemini.js               (holds key)          .googleapis.com
```

The API key lives in the Cloudflare Worker as an encrypted secret. The browser never sees it.

## Setup

### 1. Get a Gemini API Key

Go to [Google AI Studio](https://aistudio.google.com/apikey) and create a free API key.

### 2. Deploy the Cloudflare Worker Proxy

The Worker proxies requests from the browser to Gemini, keeping your API key secure.

**Option A: Deploy via Cloudflare Dashboard**

1. Go to the [Cloudflare Workers dashboard](https://dash.cloudflare.com/?to=/:account/workers)
2. Click "Create Worker"
3. Name it `shopi-proxy`
4. Paste the code from `worker/worker.js` (see below)
5. Go to Settings → Variables → Add encrypted variable:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
   - Type: Encrypt
6. Save and deploy

**Option B: Deploy via Wrangler CLI**

```bash
cd worker
npm install
npx wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key when prompted
npx wrangler deploy
```

### 3. Update the Worker URL

Open `js/gemini.js` and update the `WORKER_URL` constant with your Worker's URL:

```javascript
const WORKER_URL = 'https://shopi-proxy.YOUR_SUBDOMAIN.workers.dev';
```

### 4. Deploy to GitHub Pages

```bash
git add -A
git commit -m "Configure Worker proxy"
git push
# Settings → Pages → Source: main branch / root
# Live at https://username.github.io/repo-name/
```

## Re-skinning

Override CSS variables before the widget loads:

```html
<style>
  :root {
    --shopi-primary: #2563EB;
    --shopi-primary-hover: #1D4ED8;
    --shopi-font-family: 'Inter', sans-serif;
  }
</style>
```

## Adding Products

Edit `data/products.json`. Each product needs: `id`, `title`, `description`, `price`, `image`, `url`, `tags`, `available`.

## File Structure

```
shopi/
├── index.html              Main page with chat widget
├── css/
│   ├── reset.css           CSS reset/normalize
│   ├── variables.css       Theme system (CSS custom properties)
│   ├── layout.css          Page layout
│   └── chat.css            Chat widget styles
├── js/
│   ├── app.js              Entry point
│   ├── chat.js             Chat UI logic
│   ├── gemini.js           Gemini API via Worker proxy
│   ├── products.js         Product search
│   └── storage.js          localStorage persistence
├── data/
│   └── products.json       Product catalog
├── assets/
│   ├── logo.svg            Shopi logo
│   └── icons/              UI icons
├── worker/
│   └── worker.js           Cloudflare Worker proxy code
└── README.md
```

## Security

- API key is stored as an encrypted secret in the Cloudflare Worker
- Browser never sees the key — all Gemini requests go through the Worker
- Worker validates request method and handles errors gracefully
- CORS headers allow only your GitHub Pages domain (configurable)

## Browser Support

Modern browsers with ES module support (Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+). IE11 is not supported.
