import kafka from './client';
import { Message } from './types';
import { addMessage } from '../store/messageStore';

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || 'message-board-consumer-group'
});

let isConnected = false;

export async function startConsumer() {
  if (!isConnected) {
    await consumer.connect();
    isConnected = true;
    console.log('Kafka consumer connected');
  }

  const topic = process.env.KAFKA_TOPIC || 'message-board';

  await consumer.subscribe({
    topic,
    fromBeginning: true
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value?.toString();
        if (!value) return;

        const parsedMessage: Message = JSON.parse(value);

        console.log('Consumed message:', {
          topic,
          partition,
          offset: message.offset,
          id: parsedMessage.id
        });

        // Store message in memory
        addMessage(parsedMessage);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });

  console.log(`Consumer subscribed to topic: ${topic}`);
}

export async function stopConsumer() {
  if (isConnected) {
    await consumer.disconnect();
    isConnected = false;
    console.log('Kafka consumer disconnected');
  }
}
