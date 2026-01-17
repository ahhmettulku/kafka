import http from 'http';
import { register } from '../src/lib/metrics/registry';

const METRICS_PORT = parseInt(process.env.METRICS_PORT || '9091', 10);

export function startMetricsServer(): http.Server {
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

  server.listen(METRICS_PORT, () => {
    console.log(`[Metrics Server] Listening on http://localhost:${METRICS_PORT}/metrics`);
  });

  return server;
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
