import { Counter, Histogram, Gauge } from "prom-client";
import { register } from "./registry";

// Kafka Producer Metrics
export const producerMessagesSent = new Counter({
  name: "kafka_producer_messages_sent_total",
  help: "Total number of messages sent to Kafka",
  labelNames: ["topic", "status"],
  registers: [register],
});

export const producerMessagesSizeBytes = new Histogram({
  name: "kafka_producer_message_size_bytes",
  help: "Size of produced messages in bytes",
  labelNames: ["topic"],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000], // 100B to 10MB
  registers: [register],
});

export const producerSendDuration = new Histogram({
  name: "kafka_producer_send_duration_seconds",
  help: "Duration of Kafka producer send operations in seconds",
  labelNames: ["topic"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const producerConnectionStatus = new Gauge({
  name: "kafka_producer_connection_status",
  help: "Kafka producer connection status (1=connected, 0=disconnected)",
  registers: [register],
});

export const producerErrors = new Counter({
  name: "kafka_producer_errors_total",
  help: "Total number of Kafka producer errors",
  labelNames: ["topic", "error_type"],
  registers: [register],
});

// export const producerBatchSize = new Histogram({
//   name: 'kafka_producer_batch_size',
//   help: 'Number of messages per batch sent to Kafka',
//   labelNames: ['topic'],
//   buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
//   registers: [register],
// });

// Kafka Consumer Metrics
export const consumerMessagesConsumed = new Counter({
  name: "kafka_consumer_messages_consumed_total",
  help: "Total number of messages consumed from Kafka",
  labelNames: ["topic", "partition", "status"],
  registers: [register],
});

export const consumerProcessingDuration = new Histogram({
  name: "kafka_consumer_message_processing_duration_seconds",
  help: "Duration of Kafka consumer message processing in seconds",
  labelNames: ["topic", "partition"],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const consumerLag = new Gauge({
  name: "kafka_consumer_lag",
  help: "Kafka consumer lag (high water mark - current offset)",
  labelNames: ["topic", "partition", "consumer_group"],
  registers: [register],
});

export const consumerLagSeconds = new Gauge({
  name: "kafka_consumer_lag_seconds",
  help: "Kafka consumer lag in seconds (current time - message timestamp)",
  labelNames: ["topic", "partition", "consumer_group"],
  registers: [register],
});

export const consumerConnectionStatus = new Gauge({
  name: "kafka_consumer_connection_status",
  help: "Kafka consumer connection status (1=connected, 0=disconnected)",
  registers: [register],
});

export const consumerCurrentOffset = new Gauge({
  name: "kafka_consumer_current_offset",
  help: "Current offset position of the consumer",
  labelNames: ["topic", "partition", "consumer_group"],
  registers: [register],
});

export const consumerHighWaterMark = new Gauge({
  name: "kafka_consumer_high_water_mark",
  help: "High water mark (latest offset) of the topic partition",
  labelNames: ["topic", "partition"],
  registers: [register],
});

export const consumerErrors = new Counter({
  name: "kafka_consumer_errors_total",
  help: "Total number of Kafka consumer errors",
  labelNames: ["topic", "partition", "error_type"],
  registers: [register],
});
