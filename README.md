# Kafka Message Board - Learning Project

A real-time message board application built with Next.js 14, TypeScript, and Apache Kafka to demonstrate pub/sub messaging patterns.

## Features

- Real-time message updates using Server-Sent Events (SSE)
- Kafka producer/consumer pattern implementation
- Docker Compose setup with KRaft mode (no Zookeeper needed!)
- Kafka UI for monitoring topics and messages
- Clean TypeScript implementation
- Responsive UI with TailwindCSS

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
User Form → POST /api/messages → Kafka Producer → Topic: "message-board"
                                                           ↓
Browser ← SSE /api/messages/stream ← In-Memory Store ← Kafka Consumer
```

### Step-by-Step Process

1. **User submits a message** via the form on the web UI
2. **Form POSTs to API route** at `/api/messages`
3. **API route produces message** to Kafka topic `message-board`
4. **Background consumer reads** from topic and stores in memory
5. **SSE endpoint streams updates** to browser in real-time
6. **UI updates automatically** when new messages arrive

## Project Structure

```
kafka/
├── docker-compose.yml              # Kafka (KRaft mode) + UI
├── .env.local                      # Environment variables
├── package.json                    # Dependencies + scripts
├── src/
│   ├── app/
│   │   ├── page.tsx                # Main page
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Styles
│   │   └── api/
│   │       ├── messages/route.ts           # Producer endpoint
│   │       └── messages/stream/route.ts    # SSE endpoint
│   ├── lib/
│   │   ├── kafka/
│   │   │   ├── client.ts           # Kafka singleton
│   │   │   ├── producer.ts         # Producer logic
│   │   │   ├── consumer.ts         # Consumer logic
│   │   │   └── types.ts            # TypeScript types
│   │   └── store/
│   │       └── messageStore.ts     # In-memory storage
│   └── components/
│       ├── MessageBoard.tsx        # Main container
│       ├── MessageForm.tsx         # Input form
│       ├── MessageList.tsx         # Message list
│       └── MessageItem.tsx         # Single message
└── scripts/
    └── start-consumer.ts           # Consumer runner
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

## Experiments to Try

### Experiment 1: Multiple Browser Windows

1. Open http://localhost:3000 in two browser windows
2. Send a message from window 1
3. Watch it appear in window 2 in real-time

### Experiment 2: Consumer Resilience

1. Stop the consumer (Ctrl+C)
2. Send messages via the UI
3. Restart the consumer
4. Watch it process all queued messages

### Experiment 3: Consumer Groups

Run multiple consumers and watch Kafka distribute messages between them.

### Experiment 4: Kafka UI Exploration

1. Visit http://localhost:8080
2. Navigate to Topics → message-board
3. View messages, partitions, and consumer groups
4. Send a message and watch it appear in the UI

## Troubleshooting

### Kafka Connection Errors

- Ensure Docker services are running: `docker ps`
- Check Kafka logs: `npm run docker:logs`
- Restart services: `npm run docker:down && npm run docker:up`

### Messages Not Appearing

- Verify consumer is running in a separate terminal
- Check browser console for SSE connection errors
- Refresh the page to reconnect SSE

### Port Already in Use

If ports 9092, 8080, or 3000 are in use, you'll need to:
- Stop the conflicting service
- Or modify the ports in `docker-compose.yml` and `.env.local`

### Docker Issues on Windows

Make sure Docker Desktop is running and WSL2 backend is enabled.

## What's Next?

### Production Improvements

This is a learning project. For production, consider:

- **Persistent Storage**: Replace in-memory store with Redis or a database
- **Authentication**: Add user authentication and authorization
- **Multiple Brokers**: Run multiple Kafka brokers with replication
- **Error Handling**: Implement retry logic and dead letter queues
- **Message Validation**: Use Avro or Protobuf for schema validation
- **Monitoring**: Add metrics, logging, and alerting
- **Rate Limiting**: Prevent abuse of message posting
- **Horizontal Scaling**: Deploy multiple Next.js instances

### Extended Learning

- Add message filtering by author
- Implement message search
- Create multiple topics (e.g., channels)
- Add message persistence to PostgreSQL
- Implement message reactions
- Add WebSocket support as an alternative to SSE
- Explore Kafka Streams for message processing

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [KRaft Mode](https://kafka.apache.org/documentation/#kraft)

## About KRaft Mode

This project uses KRaft (Kafka Raft) mode instead of Zookeeper:

- **Simpler Setup**: No need for separate Zookeeper containers
- **Better Performance**: Lower latency and improved scalability
- **Modern Approach**: Zookeeper is being phased out in newer Kafka versions
- **Production Ready**: Available since Kafka 3.3+

## License

MIT - Feel free to use this for learning!
