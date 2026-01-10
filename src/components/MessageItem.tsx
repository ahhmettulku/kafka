'use client';

import { Message } from '@/lib/kafka/types';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const formattedTime = new Date(message.timestamp).toLocaleString();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-gray-800">{message.author}</span>
        <span className="text-xs text-gray-500">{formattedTime}</span>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
      <div className="mt-2 text-xs text-gray-400 font-mono">
        ID: {message.id}
      </div>
    </div>
  );
}
