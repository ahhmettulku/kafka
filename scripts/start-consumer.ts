import { startConsumer, stopConsumer } from '../src/lib/kafka/consumer';
import { startMetricsServer, stopMetricsServer } from './metrics-server';
import type http from 'http';
import fs from 'fs/promises';
import path from 'path';
import httpClient from 'http';

let metricsServer: http.Server | null = null;
let targetFilePath: string | null = null;

async function ensureTargetsDir(): Promise<string> {
  const targetsDir = path.join(
    process.cwd(),
    'monitoring',
    'prometheus',
    'targets',
    'consumers'
  );
  await fs.mkdir(targetsDir, { recursive: true });
  return targetsDir;
}

async function writeTargetFile(port: number): Promise<string> {
  const targetsDir = await ensureTargetsDir();
  const instanceId = `consumer-${process.pid}`;
  const filePath = path.join(targetsDir, `${instanceId}.json`);
  const targetGroup = [
    {
      targets: [`host.docker.internal:${port}`],
      labels: {
        service: 'kafka-consumer',
        process: 'consumer',
        instance: instanceId,
      },
    },
  ];

  await fs.writeFile(filePath, JSON.stringify(targetGroup, null, 2), 'utf8');
  return filePath;
}

async function removeTargetFile(): Promise<void> {
  if (!targetFilePath) return;
  try {
    await fs.unlink(targetFilePath);
  } catch {
    // Ignore cleanup failures on shutdown.
  }
}

async function reloadPrometheus(): Promise<void> {
  await new Promise<void>((resolve) => {
    const request = httpClient.request(
      {
        host: 'localhost',
        port: 9090,
        path: '/-/reload',
        method: 'POST',
        timeout: 2000,
      },
      (response) => {
        response.resume();
        resolve();
      }
    );

    request.on('error', () => resolve());
    request.on('timeout', () => {
      request.destroy();
      resolve();
    });
    request.end();
  });
}

async function main() {
  console.log('Starting Kafka consumer and metrics server...');

  try {
    // Start metrics server
    const { server, port } = await startMetricsServer();
    metricsServer = server;

    // Register this consumer's metrics endpoint for Prometheus
    targetFilePath = await writeTargetFile(port);
    await reloadPrometheus();

    // Start consumer
    await startConsumer();
    console.log('Consumer is running. Press Ctrl+C to exit.');
  } catch (error) {
    console.error('Failed to start consumer:', error);
    if (metricsServer) {
      await stopMetricsServer(metricsServer);
    }
    await removeTargetFile();
    await reloadPrometheus();
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
    await removeTargetFile();
    await reloadPrometheus();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  process.exit(0);
});

main();
