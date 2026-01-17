import { Counter, Histogram, Gauge } from 'prom-client';
import { register } from './registry';

// Redis Operation Metrics
export const redisOperations = new Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export const redisOperationDuration = new Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register],
});

export const redisConnectionStatus = new Gauge({
  name: 'redis_connection_status',
  help: 'Redis connection status (1=connected, 0=disconnected)',
  labelNames: ['client_type'],
  registers: [register],
});

export const redisMessagesListSize = new Gauge({
  name: 'redis_messages_list_size',
  help: 'Current size of the messages list in Redis',
  registers: [register],
});

export const redisPubSubActiveSubscriptions = new Gauge({
  name: 'redis_pubsub_active_subscriptions',
  help: 'Number of active Redis Pub/Sub subscriptions',
  registers: [register],
});
