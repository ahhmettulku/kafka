import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'kafka-nextjs-app',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

export default kafka;
