import http from 'http';
import { register } from '../src/lib/metrics/registry';

const METRICS_PORT = Number.parseInt(process.env.METRICS_PORT || '0', 10);

export async function startMetricsServer(): Promise<{ server: http.Server; port: number }> {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics' && req.method === 'GET') {
      try {
        res.setHeader('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
      } catch (error) {
        console.error('[Metrics Server] Error generating metrics:', error);
        res.statusCode = 500;
        res.end('Error generating metrics');
      }
    } else if (req.url === '/health' && req.method === 'GET') {
      res.statusCode = 200;
      res.end('OK');
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(Number.isNaN(METRICS_PORT) ? 0 : METRICS_PORT);
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : METRICS_PORT;
  console.log(`[Metrics Server] Listening on http://localhost:${port}/metrics`);

  return { server, port };
}

export function stopMetricsServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        console.error('[Metrics Server] Error stopping server:', err);
        reject(err);
      } else {
        console.log('[Metrics Server] Stopped');
        resolve();
      }
    });
  });
}
