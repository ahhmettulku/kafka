import { startConsumer, stopConsumer } from '../src/lib/kafka/consumer';

async function main() {
  console.log('Starting Kafka consumer...');

  try {
    await startConsumer();
    console.log('Consumer is running. Press Ctrl+C to exit.');
  } catch (error) {
    console.error('Failed to start consumer:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down consumer...');
  await stopConsumer();
  process.exit(0);
});

main();
