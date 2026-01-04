import kafka from './client';
import { Message } from './types';

const producer = kafka.producer();

let isConnected = false;

export async function connectProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log('Kafka producer connected');
  }
}

export async function sendMessage(message: Message) {
  await connectProducer();

  const topic = process.env.KAFKA_TOPIC || 'message-board';

  await producer.send({
    topic,
    messages: [
      {
        key: message.id,
        value: JSON.stringify(message),
        timestamp: message.timestamp.toString()
      }
    ]
  });

  console.log(`Message sent to topic ${topic}:`, message.id);
}

export async function disconnectProducer() {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
    console.log('Kafka producer disconnected');
  }
}
