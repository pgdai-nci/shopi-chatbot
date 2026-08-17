export function saveConversation(messages) {
  try {
    const data = JSON.stringify(messages.slice(-50));
    localStorage.setItem('shopi_chat_history', data);
  } catch (e) {
    // localStorage full or unavailable — silent fail
  }
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem('shopi_chat_history');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem('shopi_chat_history');
  } catch (e) {
    // silent fail
  }
}
