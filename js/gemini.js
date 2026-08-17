const WORKER_URL = 'https://shopi-proxy.live-applications.workers.dev';

const SYSTEM_INSTRUCTION = `You are Shopi, a friendly and helpful shopping assistant for an online store called Shopi. Your role is to help customers find products, answer questions about sizing, shipping, returns, and store policies.

When recommending products, format your response as natural text. The system will automatically display product cards when you mention products from the catalog.

Rules:
- Be warm, concise, and helpful
- If you don't know something about the store, say so honestly
- For sizing questions, ask about the customer's usual size and preferences
- Suggest 1-3 products when asked for recommendations
- Keep responses under 150 words unless the customer asks for detail
- If asked about orders or account, explain that you can help with product questions but order management is not yet available`;

let conversationHistory = [];
let ready = true;

export function initGemini() {
  ready = true;
}

export function isReady() {
  return ready;
}

export function clearHistory() {
  conversationHistory = [];
}

export async function sendMessageStream(text, { onToken, onComplete, onError }) {
  conversationHistory.push({ role: 'user', parts: [{ text }] });

  const params = {
    model: 'gemini-2.5-flash',
    contents: conversationHistory,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    stream: true,
  };

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'models/gemini-2.5-flash:streamGenerateContent?alt=sse',
        params,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      const error = new Error(`API error: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullText += text;
              onToken(text);
            }
          } catch (e) {
            // Skip malformed JSON chunks
          }
        }
      }
    }

    conversationHistory.push({ role: 'model', parts: [{ text: fullText }] });

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    onComplete(fullText);
  } catch (e) {
    onError(e);
  }
}
