# Kafka Message Board - Production-Ready Architecture

A real-time message board application built with Next.js 15, TypeScript, Apache Kafka, and Redis to demonstrate production-grade pub/sub messaging patterns with persistent storage and real-time updates.

## Features

- **Real-time message updates** using Server-Sent Events (SSE)
- **Kafka producer/consumer pattern** implementation
- **Redis for persistent storage** and Pub/Sub messaging
- **Production-ready architecture** with separated concerns
- **Docker Compose setup** with KRaft mode (no Zookeeper needed!)
- **Kafka UI** for monitoring topics and messages
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
└─────────────────┘     └──────┬──────┘
       ↑                       │ Consume
       │                       ↓
       │                ┌─────────────┐
       │                │   Consumer  │
       │                │  (Separate) │
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
├── docker-compose.yml              # Kafka (KRaft) + Redis + Kafka UI
├── .env.local                      # Environment variables
├── package.json                    # Dependencies + scripts
├── src/
│   ├── app/
│   │   ├── page.tsx                # Main page
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Styles
│   │   └── api/
│   │       ├── messages/route.ts           # Producer endpoint + GET
│   │       └── messages/stream/route.ts    # SSE endpoint (Redis Pub/Sub)
│   ├── lib/
│   │   ├── kafka/
│   │   │   ├── client.ts           # Kafka singleton
│   │   │   ├── producer.ts         # Producer logic
│   │   │   ├── consumer.ts         # Consumer logic (writes to Redis)
│   │   │   └── types.ts            # TypeScript types
│   │   ├── redis/
│   │   │   └── client.ts           # Redis client + Pub/Sub
│   │   └── store/
│   │       └── messageStore.ts     # Redis-based storage
│   └── components/
│       ├── MessageBoard.tsx        # Main container
│       ├── MessageForm.tsx         # Input form
│       ├── MessageList.tsx         # Message list
│       └── MessageItem.tsx         # Single message
└── scripts/
    └── start-consumer.ts           # Consumer runner (separate process)
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
- **Monitoring**: Add metrics, logging, and alerting (Prometheus, Grafana)
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
- **Monitoring**: Kafka UI (Provectus)

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Redis Documentation](https://redis.io/docs/)
- [ioredis (Redis Client)](https://github.com/redis/ioredis)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [KRaft Mode](https://kafka.apache.org/documentation/#kraft)
- [Redis Pub/Sub](https://redis.io/docs/interact/pubsub/)

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
