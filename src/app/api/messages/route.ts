import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/kafka/producer';
import { Message } from '@/lib/kafka/types';
import { getMessages } from '@/lib/store/messageStore';
import { httpRequests, httpRequestDuration, httpRequestsInProgress } from '@/lib/metrics/http-metrics';

// Ensure dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const route = '/api/messages';
  const method = 'POST';

  httpRequestsInProgress.inc({ method, route });
  const timer = httpRequestDuration.startTimer({ method, route, status_code: '200' });

  try {
    const body = await request.json();

    const { content, author } = body;

    if (!content || !author) {
      timer({ status_code: '400' });
      httpRequests.inc({ method, route, status_code: '400' });
      httpRequestsInProgress.dec({ method, route });
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

    timer({ status_code: '200' });
    httpRequests.inc({ method, route, status_code: '200' });
    httpRequestsInProgress.dec({ method, route });

    return NextResponse.json({
      success: true,
      message: 'Message sent to Kafka',
      id: message.id
    });
  } catch (error) {
    console.error('Error sending message:', error);
    timer({ status_code: '500' });
    httpRequests.inc({ method, route, status_code: '500' });
    httpRequestsInProgress.dec({ method, route });
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const route = '/api/messages';
  const method = 'GET';

  httpRequestsInProgress.inc({ method, route });
  const timer = httpRequestDuration.startTimer({ method, route, status_code: '200' });

  try {
    const messages = await getMessages(50);
    timer({ status_code: '200' });
    httpRequests.inc({ method, route, status_code: '200' });
    httpRequestsInProgress.dec({ method, route });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    timer({ status_code: '500' });
    httpRequests.inc({ method, route, status_code: '500' });
    httpRequestsInProgress.dec({ method, route });
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
