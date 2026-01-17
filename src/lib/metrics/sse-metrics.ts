import { Counter, Gauge } from 'prom-client';
import { register } from './registry';

// SSE Connection Metrics
export const sseActiveConnections = new Gauge({
  name: 'sse_active_connections',
  help: 'Number of active SSE connections',
  registers: [register],
});

export const sseConnections = new Counter({
  name: 'sse_connections_total',
  help: 'Total number of SSE connections',
  labelNames: ['status'],
  registers: [register],
});

export const sseMessagesSent = new Counter({
  name: 'sse_messages_sent_total',
  help: 'Total number of messages sent via SSE',
  labelNames: ['type'],
  registers: [register],
});

export const sseErrors = new Counter({
  name: 'sse_errors_total',
  help: 'Total number of SSE errors',
  labelNames: ['error_type'],
  registers: [register],
});
