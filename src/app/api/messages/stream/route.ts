import { NextRequest } from 'next/server';
import { createRedisSubscriber } from '@/lib/redis/client';
import { getPubSubChannel } from '@/lib/store/messageStore';
import { sseActiveConnections, sseConnections, sseMessagesSent, sseErrors } from '@/lib/metrics/sse-metrics';

// Enable streaming for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Increment active connections and total connections
  sseActiveConnections.inc();
  sseConnections.inc({ status: 'connected' });

  const stream = new ReadableStream({
    async start(controller) {
      // Create a Redis subscriber connection
      const subscriber = createRedisSubscriber();
      const channel = getPubSubChannel();

      try {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
        );
        sseMessagesSent.inc({ type: 'connection' });

        // Subscribe to Redis Pub/Sub channel
        await subscriber.subscribe(channel);
        console.log('[SSE] Subscribed to Redis channel:', channel);

        // Handle incoming messages from Redis Pub/Sub
        subscriber.on('message', (receivedChannel: string, message: string) => {
          if (receivedChannel === channel) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${message}\n\n`)
              );
              sseMessagesSent.inc({ type: 'message' });
            } catch (error) {
              console.error('[SSE] Error sending message to client:', error);
              sseErrors.inc({ error_type: 'send_failed' });
            }
          }
        });

        // Send keepalive every 15 seconds to prevent connection timeout
        const keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': keepalive\n\n'));
            sseMessagesSent.inc({ type: 'keepalive' });
          } catch (error) {
            clearInterval(keepAliveInterval);
            sseErrors.inc({ error_type: 'keepalive_failed' });
          }
        }, 15000);

        // Cleanup on connection close
        request.signal.addEventListener('abort', async () => {
          console.log('[SSE] Client disconnected, cleaning up');
          clearInterval(keepAliveInterval);
          await subscriber.unsubscribe(channel);
          await subscriber.quit();
          controller.close();

          // Decrement active connections and increment disconnection counter
          sseActiveConnections.dec();
          sseConnections.inc({ status: 'disconnected' });
        });
      } catch (error) {
        console.error('[SSE] Error in stream setup:', error);
        sseErrors.inc({ error_type: 'setup_failed' });
        sseActiveConnections.dec();
        throw error;
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
