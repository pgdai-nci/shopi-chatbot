import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are Shopi, a friendly and helpful shopping assistant for an online store called Shopi. Your role is to help customers find products, answer questions about sizing, shipping, returns, and store policies.

When recommending products, format your response as natural text. The system will automatically display product cards when you mention products from the catalog.

Rules:
- Be warm, concise, and helpful
- If you don't know something about the store, say so honestly
- For sizing questions, ask about the customer's usual size and preferences
- Suggest 1-3 products when asked for recommendations
- Keep responses under 150 words unless the customer asks for detail
- If asked about orders or account, explain that you can help with product questions but order management is not yet available`;

let ai = null;
let chat = null;
let ready = false;

export function initGemini() {
  try {
    const apiKey = 'YOUR_API_KEY_HERE';
    ai = new GoogleGenAI({ apiKey });
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    ready = true;
  } catch (e) {
    console.error('Gemini init failed:', e);
    ready = false;
  }
}

export function isReady() {
  return ready;
}

export async function sendMessageStream(text, { onToken, onComplete, onError }) {
  if (!ready || !chat) {
    onError(new Error('Gemini is not initialized. Please set your API key.'));
    return;
  }

  try {
    const stream = await chat.sendMessageStream({ message: text });
    let fullText = '';
    let firstToken = true;

    for await (const chunk of stream) {
      const token = chunk.text || '';
      if (token) {
        if (firstToken) {
          firstToken = false;
        }
        fullText += token;
        onToken(token);
      }
    }

    onComplete(fullText);
  } catch (e) {
    onError(e);
  }
}
