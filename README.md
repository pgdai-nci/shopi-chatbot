# Shopi Ecommerce Chatbot

A free, open-source shopping assistant chatbot for Shopify stores. Runs entirely client-side on GitHub Pages — no server required.

## Features

- AI-powered product recommendations via Google Gemini
- Streaming responses with real-time text display
- Product cards with images, prices, and direct links
- Conversation history persisted in localStorage
- Mobile-responsive: full-screen panel on phones, floating panel on desktop
- Accessible: keyboard navigation, screen reader support, focus management
- Re-skinable via CSS custom properties
- No frameworks, no build tools — pure vanilla JS

## Quick Start

1. **Get a Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)
2. Open `js/gemini.js` and replace `YOUR_API_KEY_HERE` with your key
3. Serve the files (GitHub Pages, or any static server)
4. Click the chat bubble and start chatting

## Deployment (GitHub Pages)

```bash
# Push to GitHub, then:
# Settings → Pages → Source: main branch / root
# Your site will be live at https://username.github.io/repo-name/
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

## Security Note

The Gemini API key is embedded in client-side JavaScript. This is acceptable for demo/personal projects. For production stores, deploy a serverless proxy (e.g., Cloudflare Worker) to protect the API key.

## File Structure

```
shopi/
├── index.html
├── css/           (reset, variables, layout, chat)
├── js/            (app, chat, gemini, products, storage)
├── data/          (products.json)
├── assets/        (logo.svg, icons/)
└── README.md
```

## Browser Support

Modern browsers with ES module support (Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+). IE11 is not supported.
