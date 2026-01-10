import { startConsumer } from './consumer';

let consumerStarted = false;

export async function ensureConsumerStarted() {
  if (consumerStarted) {
    return;
  }

  try {
    await startConsumer();
    consumerStarted = true;
    console.log('[App] Kafka consumer started successfully');
  } catch (error) {
    console.error('[App] Failed to start Kafka consumer:', error);
    throw error;
  }
}
