import { Message } from '../kafka/types';
import { getRedisClient } from '../redis/client';
import {
  redisOperations,
  redisOperationDuration,
  redisMessagesListSize,
} from '@/lib/metrics/redis-metrics';

const REDIS_KEY = 'messages';
const REDIS_CHANNEL = 'new-messages';
const MAX_MESSAGES = 100;

/**
 * Add a message to Redis
 * This is called by the Kafka consumer
 */
export async function addMessage(message: Message): Promise<void> {
  const redis = getRedisClient();

  // 1. Store message in Redis List (LPUSH adds to the beginning)
  const lpushTimer = redisOperationDuration.startTimer({ operation: 'lpush' });
  try {
    await redis.lpush(REDIS_KEY, JSON.stringify(message));
    redisOperations.inc({ operation: 'lpush', status: 'success' });
  } catch (error) {
    redisOperations.inc({ operation: 'lpush', status: 'error' });
    throw error;
  } finally {
    lpushTimer();
  }

  // 2. Keep only the last MAX_MESSAGES
  const ltrimTimer = redisOperationDuration.startTimer({ operation: 'ltrim' });
  try {
    await redis.ltrim(REDIS_KEY, 0, MAX_MESSAGES - 1);
    redisOperations.inc({ operation: 'ltrim', status: 'success' });
  } catch (error) {
    redisOperations.inc({ operation: 'ltrim', status: 'error' });
    throw error;
  } finally {
    ltrimTimer();
  }

  // 3. Publish to Redis Pub/Sub for real-time updates
  const publishTimer = redisOperationDuration.startTimer({ operation: 'publish' });
  try {
    await redis.publish(REDIS_CHANNEL, JSON.stringify(message));
    redisOperations.inc({ operation: 'publish', status: 'success' });
  } catch (error) {
    redisOperations.inc({ operation: 'publish', status: 'error' });
    throw error;
  } finally {
    publishTimer();
  }

  // Update list size gauge
  try {
    const listSize = await redis.llen(REDIS_KEY);
    redisMessagesListSize.set(listSize);
  } catch (error) {
    console.error('[MessageStore] Error getting list size:', error);
  }

  console.log('[MessageStore] Message added and published:', message.id);
}

/**
 * Get messages from Redis
 * This is called by the API route
 */
export async function getMessages(limit: number = 50): Promise<Message[]> {
  const redis = getRedisClient();

  // Get messages from Redis List (LRANGE gets a range)
  const timer = redisOperationDuration.startTimer({ operation: 'lrange' });
  try {
    const messagesJson = await redis.lrange(REDIS_KEY, 0, limit - 1);
    redisOperations.inc({ operation: 'lrange', status: 'success' });

    // Parse JSON strings back to Message objects
    const messages = messagesJson.map((json: string) => JSON.parse(json) as Message);

    return messages;
  } catch (error) {
    redisOperations.inc({ operation: 'lrange', status: 'error' });
    throw error;
  } finally {
    timer();
  }
}

/**
 * Get the Redis Pub/Sub channel name
 * Used by SSE route to subscribe
 */
export function getPubSubChannel(): string {
  return REDIS_CHANNEL;
}

/**
 * Clear all messages from Redis
 * Useful for testing
 */
export async function clearMessages(): Promise<void> {
  const redis = getRedisClient();
  await redis.del(REDIS_KEY);
  console.log('[MessageStore] All messages cleared');
}
