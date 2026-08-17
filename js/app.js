import { initGemini } from './gemini.js';
import { initChat } from './chat.js';
import { loadProducts } from './products.js';
import { loadHistory } from './storage.js';

async function init() {
  const products = await loadProducts();
  const history = loadHistory();
  initGemini();
  initChat({ products, history });
}

document.addEventListener('DOMContentLoaded', init);
