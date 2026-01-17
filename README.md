# Kafka Message Board - Production-Ready Architecture

A real-time message board application built with Next.js 15, TypeScript, Apache Kafka, and Redis to demonstrate production-grade pub/sub messaging patterns with persistent storage and real-time updates.

## Features

- **Real-time message updates** using Server-Sent Events (SSE)
- **Kafka producer/consumer pattern** implementation
- **Redis for persistent storage** and Pub/Sub messaging
- **Production-ready architecture** with separated concerns
- **Docker Compose setup** with KRaft mode (no Zookeeper needed!)
- **Kafka UI** for monitoring topics and messages
- **Prometheus metrics** for comprehensive observability
- **Grafana dashboards** with pre-built visualizations
- **Scalable design** - can run multiple instances
- **Clean TypeScript** implementation
- **Responsive UI** with TailwindCSS

## Prerequisites

- Node.js 18+
- Docker Desktop
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Kafka Infrastructure

```bash
npm run docker:up
```

Wait 30-60 seconds for Kafka to be ready. You can check the logs:

```bash
npm run docker:logs
```

### 3. Start the Kafka Consumer

In a new terminal window:

```bash
npm run kafka:consumer
```

Keep this running in the background. You should see:
```
Starting Kafka consumer...
Kafka consumer connected
Consumer subscribed to topic: message-board
```

### 4. Start the Next.js Development Server

In another terminal window:

```bash
npm run dev
```

### 5. Access the Application

- **Message Board**: http://localhost:3000
- **Kafka UI**: http://localhost:8080
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

## How It Works

### Architecture Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ POST message
       ↓
┌─────────────────┐     ┌─────────────┐
│   Next.js API   │────→│    Kafka    │
│   (Producer)    │     │   Broker    │
│   + Metrics     │     └──────┬──────┘
└─────────────────┘            │ Consume
       ↑                       ↓
       │                ┌─────────────┐
       │                │   Consumer  │
       │                │  + Metrics  │
       │                └──────┬──────┘
       │                       │ Write & Publish
       │                       ↓
       │                ┌─────────────┐
       │                │    Redis    │
       │                │  - Storage  │
       │                │  - Pub/Sub  │
       │                └──────┬──────┘
       │                       │ Subscribe
       │ SSE Stream            ↓
       │←───────────────┌─────────────┐
       │                │   Next.js   │
       │                │ SSE Route   │
       │                └─────────────┘
       ↓
┌─────────────┐
│   Browser   │
│  (Updates)  │
└─────────────┘

       ┌──────────────────────────────────────┐
       │          Monitoring Layer            │
       ├──────────────────────────────────────┤
       │  Prometheus (9090)                   │
       │    ↓ scrapes                         │
       │  - Next.js metrics (:3000/api/metrics)
       │  - Consumer metrics (:9091/metrics)  │
       │    ↓ data source                     │
       │  Grafana (3001)                      │
       │  - Pre-built Dashboard               │
       │  - Alert Visualization               │
       └──────────────────────────────────────┘
```

### Step-by-Step Process

1. **User submits a message** via the form on the web UI
2. **Form POSTs to API route** at `/api/messages`
3. **API route produces message** to Kafka topic `message-board`
4. **Background consumer reads** from Kafka and writes to Redis
5. **Consumer publishes** to Redis Pub/Sub channel for real-time notifications
6. **Next.js SSE route subscribes** to Redis Pub/Sub
7. **SSE pushes updates** to connected browsers in real-time
8. **UI updates automatically** when new messages arrive

### Why This Architecture?

This production-ready architecture provides:

- ✅ **Scalability**: Multiple Next.js and consumer instances can run simultaneously
- ✅ **Persistence**: Messages survive server restarts (stored in Redis)
- ✅ **Real-time**: SSE + Redis Pub/Sub for instant updates across all clients
- ✅ **Separation of Concerns**: Web server and message processing are independent
- ✅ **Resilience**: Component failures don't cascade
- ✅ **Industry Standard**: Used by production applications at scale

## Project Structure

```
kafka/
├── docker-compose.yml              # Kafka + Redis + Prometheus + Grafana
├── .env.local                      # Environment variables
├── package.json                    # Dependencies + scripts
├── src/
│   ├── app/
│   │   ├── page.tsx                # Main page
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Styles
│   │   └── api/
│   │       ├── messages/route.ts           # Producer endpoint + GET
│   │       ├── messages/stream/route.ts    # SSE endpoint (Redis Pub/Sub)
│   │       └── metrics/route.ts            # Prometheus metrics endpoint
│   ├── lib/
│   │   ├── kafka/
│   │   │   ├── client.ts           # Kafka singleton
│   │   │   ├── producer.ts         # Producer logic (with metrics)
│   │   │   ├── consumer.ts         # Consumer logic (with metrics)
│   │   │   └── types.ts            # TypeScript types
│   │   ├── redis/
│   │   │   └── client.ts           # Redis client + Pub/Sub (with metrics)
│   │   ├── store/
│   │   │   └── messageStore.ts     # Redis-based storage (with metrics)
│   │   └── metrics/                # Prometheus metrics
│   │       ├── registry.ts         # Prometheus registry
│   │       ├── kafka-metrics.ts    # Kafka producer/consumer metrics
│   │       ├── redis-metrics.ts    # Redis operation metrics
│   │       ├── http-metrics.ts     # HTTP request metrics
│   │       └── sse-metrics.ts      # SSE connection metrics
│   └── components/
│       ├── MessageBoard.tsx        # Main container
│       ├── MessageForm.tsx         # Input form
│       ├── MessageList.tsx         # Message list
│       └── MessageItem.tsx         # Single message
├── scripts/
│   ├── start-consumer.ts           # Consumer runner (with metrics server)
│   └── metrics-server.ts           # Standalone metrics server for consumer
└── monitoring/
    ├── prometheus/
    │   ├── prometheus.yml          # Prometheus configuration
    │   └── alerts.yml              # Alert rules
    └── grafana/
        └── provisioning/
            ├── datasources/        # Auto-configured Prometheus datasource
            └── dashboards/         # Pre-built Grafana dashboards
```

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run kafka:consumer` - Start Kafka consumer
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services
- `npm run docker:logs` - View Kafka logs

## Learning Kafka Concepts

### 1. Topics

Topics are categories where messages are published. In this app, all messages go to the `message-board` topic.

View topics in Kafka UI: http://localhost:8080 → Topics

### 2. Producers

Producers send messages to topics. See [src/lib/kafka/producer.ts](src/lib/kafka/producer.ts).

The API route at [src/app/api/messages/route.ts](src/app/api/messages/route.ts) uses the producer to send messages.

### 3. Consumers

Consumers read messages from topics. See [src/lib/kafka/consumer.ts](src/lib/kafka/consumer.ts).

The consumer runs in a separate process ([scripts/start-consumer.ts](scripts/start-consumer.ts)).

### 4. Consumer Groups

Consumers belong to consumer groups (configured in `.env.local`). Multiple consumers in the same group share the workload.

Try running multiple consumers:
```bash
# Terminal 1
npm run kafka:consumer

# Terminal 2
npm run kafka:consumer
```

Messages will be distributed between them!

### 5. Message Ordering

Messages in the same partition are ordered. Since we use the message ID as the key, messages from the same ID always go to the same partition.

### 6. Server-Sent Events (SSE)

SSE provides a one-way channel from server to client for real-time updates. See [src/app/api/messages/stream/route.ts](src/app/api/messages/stream/route.ts).

The SSE route subscribes to Redis Pub/Sub and pushes updates to connected browsers.

### 7. Redis for Storage and Messaging

Redis serves two critical roles in this architecture:

**Storage**: Redis Lists (`LPUSH`, `LRANGE`) store the last 100 messages persistently. See [src/lib/store/messageStore.ts](src/lib/store/messageStore.ts).

**Pub/Sub**: Redis Pub/Sub broadcasts new messages to all Next.js instances in real-time:
- **Publisher**: Kafka consumer publishes to `new-messages` channel
- **Subscribers**: Each Next.js SSE route subscribes to the channel
- **Result**: All connected browsers get instant updates

Try it:
```bash
# Terminal 1: Subscribe to channel
docker exec -it redis redis-cli
SUBSCRIBE new-messages

# Terminal 2: Send a message via UI
# Watch it appear in Terminal 1!
```

## Experiments to Try

### Experiment 1: Multiple Browser Windows (Real-time Sync)

1. Open http://localhost:3000 in two browser windows
2. Send a message from window 1
3. Watch it appear in window 2 **instantly** via SSE + Redis Pub/Sub
4. Both windows stay in sync in real-time

### Experiment 2: Consumer Resilience & Message Persistence

1. Stop the consumer (Ctrl+C)
2. Send messages via the UI (they go to Kafka)
3. Restart the consumer
4. Watch it process all queued messages from Kafka
5. Messages are now persisted in Redis
6. Restart Next.js server - messages still there!

### Experiment 3: Consumer Groups

Run multiple consumers and watch Kafka distribute messages between them:
```bash
# Terminal 1
npm run kafka:consumer

# Terminal 2
npm run kafka:consumer
```
Watch the logs - each consumer processes different partitions.

### Experiment 4: Kafka UI Exploration

1. Visit http://localhost:8080
2. Navigate to Topics → message-board
3. View messages, partitions, and consumer groups
4. Send a message and watch it appear in the UI

### Experiment 5: Redis Inspection

Inspect Redis data directly:
```bash
# Connect to Redis CLI
docker exec -it redis redis-cli

# View stored messages
LRANGE messages 0 -1

# View message count
LLEN messages

# Monitor Pub/Sub in real-time
SUBSCRIBE new-messages
# (In another terminal, send a message and watch it here)

# View active Pub/Sub channels
PUBSUB CHANNELS
```

### Experiment 6: Server Restart Persistence

1. Send several messages
2. Stop Next.js dev server (Ctrl+C)
3. Stop and restart Docker: `npm run docker:down && npm run docker:up`
4. Start Next.js again: `npm run dev`
5. Messages are still there! (Thanks to Redis AOF persistence)

## Monitoring with Prometheus & Grafana

This application includes a comprehensive monitoring stack with Prometheus for metrics collection and Grafana for visualization.

### Accessing Monitoring Tools

- **Prometheus**: http://localhost:9090 - Query and explore metrics
- **Grafana**: http://localhost:3001 - Visualize metrics (login: admin/admin)
- **Next.js Metrics**: http://localhost:3000/api/metrics - Raw Prometheus metrics
- **Consumer Metrics**: http://localhost:9091/metrics - Consumer process metrics

### Pre-built Grafana Dashboard

The Grafana dashboard includes 6 sections with 20+ panels:

1. **Overview** - Total messages, active SSE connections, request rate
2. **Kafka Producer** - Message send rate, latency percentiles (p50/p95/p99)
3. **Kafka Consumer** - Consume rate, consumer lag, processing latency
4. **Redis** - Operation rates, latency by operation type, list size
5. **HTTP/API** - Request rates by endpoint, response time percentiles
6. **SSE Streaming** - Active connections, message streaming rate

### Metrics Collected

**Kafka Metrics:**
- `kafka_producer_messages_sent_total` - Messages sent with success/error status
- `kafka_producer_send_duration_seconds` - Producer send latency histogram
- `kafka_consumer_messages_consumed_total` - Messages consumed per partition
- `kafka_consumer_lag` - Consumer lag in message count (updated every 30 seconds)
- `kafka_consumer_lag_seconds` - Consumer lag in seconds (time since message was produced)
- `kafka_consumer_message_processing_duration_seconds` - Message processing latency

**Redis Metrics:**
- `redis_operations_total` - Operations by type (lpush, ltrim, lrange, publish)
- `redis_operation_duration_seconds` - Operation latency histogram
- `redis_messages_list_size` - Current messages stored in Redis

**HTTP Metrics:**
- `http_requests_total` - Requests by method, route, and status code
- `http_request_duration_seconds` - Request duration histogram

**SSE Metrics:**
- `sse_active_connections` - Current active SSE connections
- `sse_messages_sent_total` - Messages sent via SSE by type

### Alert Rules

Production-ready alerts with intelligent thresholds. All alerts include `runbook_url` annotations for incident response.

**Kafka Alerts (velocity-based, not absolute thresholds):**
- **KafkaConsumerLagGrowing** - Lag increasing at >10 msgs/sec (consumer falling behind)
- **KafkaConsumerLagGrowingFast** - Lag increasing at >100 msgs/sec (critical)
- **KafkaHighTimeToDrain** - Would take >5 min to catch up at current rate
- **KafkaCriticalTimeToDrain** - Would take >30 min to catch up (SLA breach)
- **KafkaConsumerThroughputDrop** - Throughput dropped to <50% of hourly average
- **KafkaHighConsumerLagSeconds** - Messages are >60 seconds old
- **KafkaProducerErrors** / **KafkaConsumerErrors** - Error rate above 0.1/sec

**Redis Alerts:**
- **RedisConnectionDown** - Connection lost for 1 minute
- **RedisHighMemoryUsage** - Memory usage >85% (warning) / >95% (critical)
- **RedisConnectionPoolExhaustion** - Pool <10% available
- **RedisSlowOperations** - p95 latency >100ms (warning) / >500ms (critical)
- **RedisEvictions** - Keys being evicted due to memory pressure

**HTTP/Application Alerts:**
- **HighHTTPErrorRate** - 5xx error rate >1% of requests
- **SlowHTTPResponses** - p95 response time >2s (warning) / >5s (critical)
- **MessageProcessingFailures** - >1% of messages failing
- **NoMessagesProcessed** - No messages consumed in 10 minutes

### Verifying Metrics

```bash
# Check Next.js metrics
curl http://localhost:3000/api/metrics | grep kafka_producer

# Check consumer metrics
curl http://localhost:9091/metrics | grep kafka_consumer

# Verify Prometheus targets
# Visit http://localhost:9090/targets - both should show "UP"
```

For detailed monitoring documentation, see [PROMETHEUS_SETUP.md](PROMETHEUS_SETUP.md).

## Troubleshooting

### Kafka Connection Errors

- Ensure Docker services are running: `docker ps`
- Check Kafka logs: `npm run docker:logs`
- Restart services: `npm run docker:down && npm run docker:up`

### Redis Connection Errors

- Check if Redis container is running: `docker ps | grep redis`
- Test Redis connection: `docker exec -it redis redis-cli ping` (should return "PONG")
- Check Redis logs: `docker logs redis`
- Verify environment variables in `.env.local`

### Messages Not Appearing

- Verify consumer is running in a separate terminal
- Check browser console for SSE connection errors
- Verify Redis is accessible: `docker exec -it redis redis-cli`
  - Run `LRANGE messages 0 -1` to see stored messages
  - Run `PUBSUB CHANNELS` to see active channels
- Refresh the page to reconnect SSE
- Check Next.js server logs for Redis connection errors

### SSE Connection Issues

- Look for `[SSE] Subscribed to Redis channel` in server logs
- Check browser Network tab for `/api/messages/stream` request
- If SSE keeps reconnecting, check Redis Pub/Sub setup

### Port Already in Use

If ports 9092, 8080, 6379, or 3000 are in use, you'll need to:
- Stop the conflicting service
- Or modify the ports in `docker-compose.yml` and `.env.local`

### Docker Issues on Windows

Make sure Docker Desktop is running and WSL2 backend is enabled.

### Prometheus/Grafana Issues

**Prometheus targets showing "DOWN":**
- Ensure Next.js app is running (`npm run dev`)
- Ensure consumer is running (`npm run kafka:consumer`)
- Check if metrics endpoints are accessible:
  ```bash
  curl http://localhost:3000/api/metrics
  curl http://localhost:9091/metrics
  ```

**Grafana dashboard not loading:**
- Check Grafana logs: `docker logs grafana`
- Verify datasource connection in Grafana UI
- Manually import dashboard from `monitoring/grafana/provisioning/dashboards/`

**Metrics not updating:**
- Send test messages to generate metric data
- Check Prometheus UI for scrape errors
- Verify time range in Grafana dashboard

### Consumer Not Processing Messages

- Check consumer logs for connection errors
- Verify Kafka topic exists: http://localhost:8080 → Topics
- Ensure Redis is accessible from consumer
- Check for duplicate consumer group instances

## What's Next?

### Further Production Improvements

This project demonstrates production-ready architecture. Additional improvements for large-scale production:

- **Authentication**: Add user authentication and authorization
- **Multiple Kafka Brokers**: Run multiple Kafka brokers with replication
- **Error Handling**: Implement retry logic and dead letter queues
- **Message Validation**: Use Avro or Protobuf for schema validation
- **Alert Manager**: Add AlertManager for Slack/Email notifications
- **Distributed Tracing**: Add OpenTelemetry with Jaeger/Tempo
- **Rate Limiting**: Prevent abuse of message posting
- **Horizontal Scaling**: Deploy multiple Next.js and consumer instances
- **Database**: Add PostgreSQL for user data and long-term message storage
- **CDN**: Use CDN for static assets
- **Load Balancer**: Use nginx or cloud load balancer for traffic distribution

### Extended Learning

- Add message filtering by author
- Implement message search
- Create multiple topics (e.g., channels)
- Add message persistence to PostgreSQL
- Implement message reactions
- Add WebSocket support as an alternative to SSE
- Explore Kafka Streams for message processing

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Message Queue**: Apache Kafka (KRaft mode)
- **Storage & Cache**: Redis 7 (List + Pub/Sub)
- **Real-time**: Server-Sent Events (SSE)
- **Containerization**: Docker & Docker Compose
- **Monitoring**: Prometheus, Grafana, Kafka UI (Provectus)
- **Metrics Library**: prom-client (Prometheus client for Node.js)

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Redis Documentation](https://redis.io/docs/)
- [ioredis (Redis Client)](https://github.com/redis/ioredis)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [KRaft Mode](https://kafka.apache.org/documentation/#kraft)
- [Redis Pub/Sub](https://redis.io/docs/interact/pubsub/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [prom-client (Node.js Prometheus Client)](https://github.com/siimon/prom-client)

## About KRaft Mode

This project uses KRaft (Kafka Raft) mode instead of Zookeeper:

- **Simpler Setup**: No need for separate Zookeeper containers
- **Better Performance**: Lower latency and improved scalability
- **Modern Approach**: Zookeeper is being phased out in newer Kafka versions
- **Production Ready**: Available since Kafka 3.3+

## About Redis

Redis is used for both storage and real-time messaging:

- **Storage**: Redis Lists store the last 100 messages (persistent with AOF)
- **Pub/Sub**: Redis Pub/Sub broadcasts new messages to all Next.js instances
- **Fast**: In-memory data structure store with microsecond latency
- **Reliable**: AOF (Append Only File) persistence enabled for durability
- **Scalable**: Can handle thousands of concurrent connections

### Redis Data Structures Used

1. **List (`messages`)**: Stores message objects as JSON strings
   - Command: `LPUSH` (add to front), `LRANGE` (retrieve)
   - Auto-trimmed to keep last 100 messages

2. **Pub/Sub (`new-messages` channel)**: Real-time message broadcasting
   - Publishers: Kafka consumers
   - Subscribers: Next.js SSE routes

## License

MIT - Feel free to use this for learning!
