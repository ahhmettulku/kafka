import { Message } from '../kafka/types';

// In-memory storage (for production, use Redis or a database)
const messages: Message[] = [];
const MAX_MESSAGES = 100;

// Event emitter for real-time updates
type Listener = (message: Message) => void;
const listeners: Listener[] = [];

export function addMessage(message: Message) {
  messages.unshift(message);

  // Keep only last 100 messages
  if (messages.length > MAX_MESSAGES) {
    messages.pop();
  }

  // Notify all listeners
  listeners.forEach(listener => listener(message));
}

export function getMessages(limit: number = 50): Message[] {
  return messages.slice(0, limit);
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);

  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

export function clearMessages() {
  messages.length = 0;
}
