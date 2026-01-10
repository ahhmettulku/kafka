'use client';

import { useState, useEffect } from 'react';
import { Message } from '@/lib/kafka/types';
import MessageForm from './MessageForm';
import MessageList from './MessageList';

export default function MessageBoard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Fetch initial messages
    fetchMessages();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        // Connect to SSE for real-time updates
        eventSource = new EventSource('/api/messages/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
          console.log('SSE connected');
        };

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('SSE connection confirmed');
            return;
          }

          // Add new message to the top
          setMessages((prev) => [data, ...prev]);
        };

        eventSource.onerror = (error) => {
          console.error('SSE error:', error);
          console.error('SSE readyState:', eventSource?.readyState);
          setIsConnected(false);

          // Close the failed connection
          eventSource?.close();

          // Retry connection after 3 seconds
          console.log('Reconnecting in 3 seconds...');
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (error) {
        console.error('Failed to create EventSource:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Kafka Message Board
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-600">
              {isConnected ? 'Connected to real-time updates' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <MessageForm onMessageSent={fetchMessages} />
          </div>

          <div className="lg:col-span-2">
            <div className="bg-gray-100 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Messages ({messages.length})
              </h2>
              <MessageList messages={messages} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
