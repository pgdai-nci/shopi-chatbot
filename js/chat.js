import { sendMessageStream, isReady } from './gemini.js';
import { searchProducts } from './products.js';
import { saveConversation } from './storage.js';

let widget, bubble, panel, messagesEl, inputForm, inputField, sendBtn, chipsEl;
let widgetState = 'closed';
let conversationHistory = [];
let chatProducts = [];
let rateLimitCount = 0;
let userScrolledUp = false;
let firstVisitDone = false;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

export function initChat({ products, history }) {
  chatProducts = products;
  widget = document.getElementById('shopi-chat-widget');
  bubble = document.getElementById('shopi-bubble');
  panel = document.getElementById('shopi-panel');
  messagesEl = document.getElementById('shopi-messages');
  inputForm = document.getElementById('shopi-input-form');
  inputField = document.getElementById('shopi-input');
  sendBtn = document.getElementById('shopi-send');
  chipsEl = document.getElementById('shopi-chips');

  initInput();
  initBubble();
  initPanelClose();
  initEscape();
  initFocusTrap();
  initOfflineDetection();
  initScrollDetection();

  conversationHistory = history || [];
  if (conversationHistory.length > 0) {
    firstVisitDone = true;
    restoreHistory();
    hideChips();
  }
}

function initBubble() {
  bubble.addEventListener('click', () => {
    if (widgetState === 'closed') {
      openPanel();
    } else {
      closePanel();
    }
  });
}

function initPanelClose() {
  document.getElementById('shopi-panel-close').addEventListener('click', closePanel);
}

function initInput() {
  inputField.addEventListener('input', () => {
    sendBtn.disabled = inputField.value.trim().length === 0;
  });

  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = inputField.value.trim();
    if (!text || widgetState === 'loading') return;
    sendMessage(text);
    inputField.value = '';
    sendBtn.disabled = true;
  });

  chipsEl.querySelectorAll('.shopi-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sendMessage(chip.dataset.message);
    });
  });
}

function initEscape() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && widgetState !== 'closed') {
      closePanel();
    }
  });
}

function initFocusTrap() {
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = panel.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

function initOfflineDetection() {
  window.addEventListener('offline', () => {
    inputField.disabled = true;
    sendBtn.disabled = true;
  });
  window.addEventListener('online', () => {
    inputField.disabled = false;
    sendBtn.disabled = inputField.value.trim().length === 0;
  });
}

function initScrollDetection() {
  messagesEl.addEventListener('scroll', () => {
    const distanceFromBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight;
    userScrolledUp = distanceFromBottom > 100;
  });
}

function openPanel() {
  widgetState = 'open';
  bubble.setAttribute('aria-expanded', 'true');
  panel.classList.remove('shopi-panel--hidden');
  setBubbleIcon('close');

  if (window.innerWidth < 768) {
    bubble.style.display = 'none';
  }

  if (!firstVisitDone) {
    firstVisitDone = true;
    setTimeout(() => {
      appendMessage('system', "Hi there! 👋 I'm Shopi, your shopping assistant. How can I help you today?");
    }, 300);
  }

  inputField.focus();
  scrollToBottom();
}

function closePanel() {
  widgetState = 'closed';
  bubble.setAttribute('aria-expanded', 'false');
  panel.classList.add('shopi-panel--hidden');
  setBubbleIcon('chat');
  bubble.style.display = '';
  bubble.focus();
}

function setBubbleIcon(icon) {
  const openIcon = bubble.querySelector('.shopi-bubble-icon--open');
  const closeIcon = bubble.querySelector('.shopi-bubble-icon--close');
  if (icon === 'close') {
    openIcon.hidden = true;
    closeIcon.hidden = false;
  } else {
    openIcon.hidden = false;
    closeIcon.hidden = true;
  }
}

function setWidgetState(state) {
  widgetState = state;
  if (state === 'loading') {
    inputField.disabled = true;
    sendBtn.disabled = true;
    showTypingIndicator();
  } else if (state === 'streaming') {
    hideTypingIndicator();
    inputField.disabled = true;
    sendBtn.disabled = true;
  } else {
    hideTypingIndicator();
    inputField.disabled = false;
    sendBtn.disabled = inputField.value.trim().length === 0;
  }
}

function showTypingIndicator() {
  hideTypingIndicator();
  const el = document.createElement('div');
  el.className = 'shopi-typing';
  el.id = 'shopi-typing';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', 'Shopi is typing');
  el.innerHTML = '<div class="shopi-typing__dot"></div><div class="shopi-typing__dot"></div><div class="shopi-typing__dot"></div>';
  messagesEl.appendChild(el);
  scrollToBottom();
}

function hideTypingIndicator() {
  const el = document.getElementById('shopi-typing');
  if (el) el.remove();
}

export function appendMessage(type, text) {
  const el = document.createElement('div');
  el.className = `shopi-message shopi-message--${type}`;

  if (type === 'bot') {
    el.innerHTML = `
      <img class="shopi-message__avatar" src="assets/icons/bot-avatar.svg" alt="" width="32" height="32">
      <div class="shopi-message__bubble">
        <span class="shopi-message__content"></span>
      </div>`;
  } else if (type === 'user') {
    el.innerHTML = `
      <div class="shopi-message__bubble">
        <span class="shopi-message__content">${escapeHtml(text)}</span>
      </div>`;
  } else if (type === 'system') {
    const msg = text.startsWith('Error:') ? 'shopi-message--error' : '';
    if (msg) el.classList.add(msg);
    el.setAttribute('role', text.startsWith('Error:') ? 'alert' : 'status');
    el.innerHTML = `<span class="shopi-message__text">${text}</span>`;
  }

  messagesEl.appendChild(el);
  scrollToBottom();
  return el;
}

export function updateMessageContent(el, text) {
  const content = el.querySelector('.shopi-message__content');
  if (content) {
    content.textContent = text;
    const bubble = el.querySelector('.shopi-message__bubble');
    // Remove old cursor, add new one
    bubble.querySelectorAll('.shopi-cursor').forEach(c => c.remove());
    if (widgetState === 'streaming') {
      const cursor = document.createElement('span');
      cursor.className = 'shopi-cursor';
      bubble.appendChild(cursor);
    }
  }
}

export function renderProductCards(products) {
  const container = document.createElement('div');
  container.className = 'shopi-product-cards' + (products.length > 1 ? ' shopi-product-cards--multiple' : '');

  products.slice(0, 4).forEach(product => {
    container.innerHTML += createProductCardHTML(product);
  });

  if (products.length > 4) {
    container.innerHTML += `<button class="shopi-product-cards__more" data-offset="4">Show ${Math.min(products.length - 4, 4)} more</button>`;
  }

  messagesEl.appendChild(container);
  scrollToBottom();
}

function createProductCardHTML(product) {
  return `
    <div class="shopi-product-card">
      <img class="shopi-product-card__image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" width="280" height="200" loading="lazy">
      <div class="shopi-product-card__body">
        <h4 class="shopi-product-card__title">${escapeHtml(product.title)}</h4>
        <p class="shopi-product-card__price">${escapeHtml(product.price)}</p>
        <a class="shopi-product-card__cta" href="${escapeHtml(product.url)}" target="_blank" rel="noopener noreferrer">View product</a>
      </div>
    </div>`;
}

function hideChips() {
  chipsEl.classList.add('shopi-chips--hidden');
}

export function scrollToBottom() {
  if (!userScrolledUp) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

function restoreHistory() {
  conversationHistory.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'bot') {
      const el = appendMessage(msg.role, '');
      const content = el.querySelector('.shopi-message__content');
      if (content) content.textContent = msg.content;
    }
  });
}

async function sendMessage(text) {
  hideChips();

  if (!navigator.onLine) {
    appendMessage('system', 'Error: You appear to be offline. Please check your connection and try again.');
    return;
  }

  if (!isReady()) {
    appendMessage('system', 'Error: Chat is not configured. Please set your Gemini API key in js/gemini.js.');
    return;
  }

  appendMessage('user', text);
  conversationHistory.push({ role: 'user', content: text, timestamp: Date.now() });

  setWidgetState('loading');

  const botMsgEl = appendMessage('bot', '');
  setWidgetState('streaming');

  let fullResponse = '';
  await sendMessageStream(text, {
    onToken: (token) => {
      fullResponse += token;
      updateMessageContent(botMsgEl, fullResponse);
      scrollToBottom();
    },
    onComplete: (response) => {
      // Remove cursor
      const bubble = botMsgEl.querySelector('.shopi-message__bubble');
      bubble.querySelectorAll('.shopi-cursor').forEach(c => c.remove());

      conversationHistory.push({ role: 'bot', content: response, timestamp: Date.now() });
      saveConversation(conversationHistory);

      checkAndRenderProducts(response);
      rateLimitCount = 0;
      setWidgetState('open');
    },
    onError: (error) => {
      handleStreamError(error, botMsgEl);
    }
  });
}

function checkAndRenderProducts(response) {
  const lower = response.toLowerCase();
  const productKeywords = chatProducts.map(p => p.title.toLowerCase().split(' ')).flat();
  const matches = productKeywords.filter(kw => lower.includes(kw));

  if (matches.length > 0) {
    const scored = chatProducts.map(p => ({
      ...p,
      score: matches.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0)
    })).filter(p => p.score > 0).sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      renderProductCards(scored.slice(0, 4));
    }
  }
}

export function handleStreamError(error, msgEl) {
  const bubble = msgEl.querySelector('.shopi-message__bubble');
  if (bubble) bubble.remove();
  msgEl.remove();

  console.error('Stream error:', error);

  if (error.message && error.message.includes('429')) {
    rateLimitCount++;
    if (rateLimitCount >= 3) {
      appendMessage('system', "Error: I'm temporarily unavailable. Please try again in a few minutes.");
    } else {
      appendMessage('system', "Error: I'm getting a lot of questions right now. Please try again in a moment.");
    }
    inputField.disabled = true;
    sendBtn.disabled = true;
    setTimeout(() => {
      inputField.disabled = false;
      sendBtn.disabled = inputField.value.trim().length === 0;
    }, 3000);
  } else {
    appendMessage('system', 'Error: Something went wrong. Please try again.');
    setWidgetState('open');
  }
}
