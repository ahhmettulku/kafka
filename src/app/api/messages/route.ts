import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/kafka/producer';
import { Message } from '@/lib/kafka/types';
import { getMessages } from '@/lib/store/messageStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { content, author } = body;

    if (!content || !author) {
      return NextResponse.json(
        { error: 'Content and author are required' },
        { status: 400 }
      );
    }

    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      author,
      timestamp: Date.now()
    };

    await sendMessage(message);

    return NextResponse.json({
      success: true,
      message: 'Message sent to Kafka',
      id: message.id
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const messages = getMessages(50);

  return NextResponse.json({ messages });
}
