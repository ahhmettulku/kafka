import { startConsumer, stopConsumer } from '../src/lib/kafka/consumer';
import { startMetricsServer, stopMetricsServer } from './metrics-server';
import type http from 'http';

let metricsServer: http.Server | null = null;

async function main() {
  console.log('Starting Kafka consumer and metrics server...');

  try {
    // Start metrics server
    metricsServer = startMetricsServer();

    // Start consumer
    await startConsumer();
    console.log('Consumer is running. Press Ctrl+C to exit.');
  } catch (error) {
    console.error('Failed to start consumer:', error);
    if (metricsServer) {
      await stopMetricsServer(metricsServer);
    }
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down consumer and metrics server...');

  try {
    await stopConsumer();
    if (metricsServer) {
      await stopMetricsServer(metricsServer);
    }
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  process.exit(0);
});

main();
