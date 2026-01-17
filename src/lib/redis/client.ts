import Redis, { RedisOptions } from 'ioredis';
import { redisConnectionStatus, redisPubSubActiveSubscriptions } from '@/lib/metrics/redis-metrics';

// Singleton Redis client
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      retryStrategy: (times: number): number | null => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    redisClient = new Redis(options);

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      redisConnectionStatus.set({ client_type: 'main' }, 1);
    });

    redisClient.on('error', (error: Error) => {
      console.error('[Redis] Connection error:', error);
      redisConnectionStatus.set({ client_type: 'main' }, 0);
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
      redisConnectionStatus.set({ client_type: 'main' }, 0);
    });
  }

  return redisClient;
}

// Create a new subscriber client (for Pub/Sub)
// Note: Pub/Sub requires a separate connection
export function createRedisSubscriber(): Redis {
  const options: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    retryStrategy: (times: number): number | null => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };

  const subscriber = new Redis(options);

  subscriber.on('connect', () => {
    console.log('[Redis Subscriber] Connected successfully');
    redisConnectionStatus.set({ client_type: 'subscriber' }, 1);
  });

  subscriber.on('error', (error: Error) => {
    console.error('[Redis Subscriber] Error:', error);
    redisConnectionStatus.set({ client_type: 'subscriber' }, 0);
  });

  subscriber.on('subscribe', (channel: string) => {
    redisPubSubActiveSubscriptions.inc();
  });

  subscriber.on('unsubscribe', (channel: string) => {
    redisPubSubActiveSubscriptions.dec();
  });

  return subscriber;
}

export default getRedisClient;
