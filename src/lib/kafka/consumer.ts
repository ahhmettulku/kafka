import kafka from "./client";
import { Message } from "./types";
import { addMessage } from "../store/messageStore";
import {
  consumerMessagesConsumed,
  consumerProcessingDuration,
  consumerConnectionStatus,
  consumerLag,
  consumerLagSeconds,
  consumerCurrentOffset,
  consumerHighWaterMark,
} from "@/lib/metrics/kafka-metrics";

const groupId = process.env.KAFKA_GROUP_ID || "message-board-consumer-group";
const consumer = kafka.consumer({
  groupId,
  maxBytes: 1048576,
  minBytes: 1,
  maxWaitTimeInMs: 0,
  retry: {
    retries: 3,
    initialRetryTime: 100,
  },
});
const admin = kafka.admin();

let isConnected = false;
let lagUpdateInterval: NodeJS.Timeout | null = null;

async function updateConsumerLag() {
  const topic = process.env.KAFKA_TOPIC || "message-board";

  try {
    await admin.connect();

    // Get consumer group offsets
    const offsetsResponse = await admin.fetchOffsets({
      groupId,
      topics: [topic],
    });

    // Get topic offsets (high water marks)
    const topicOffsets = await admin.fetchTopicOffsets(topic);

    // Calculate and update lag for each partition
    for (const topicOffsetData of offsetsResponse) {
      if (topicOffsetData.topic === topic) {
        for (const partitionOffset of topicOffsetData.partitions) {
          const partition = partitionOffset.partition;
          const currentOffset = parseInt(partitionOffset.offset, 10);
          const topicOffset = topicOffsets.find(
            (t) => t.partition === partition
          );

          if (topicOffset) {
            const highWaterMark = parseInt(topicOffset.high, 10);
            const lag = highWaterMark - currentOffset;

            consumerLag.set(
              {
                topic,
                partition: partition.toString(),
                consumer_group: groupId,
              },
              lag
            );
            consumerCurrentOffset.set(
              {
                topic,
                partition: partition.toString(),
                consumer_group: groupId,
              },
              currentOffset
            );
            consumerHighWaterMark.set(
              { topic, partition: partition.toString() },
              highWaterMark
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error updating consumer lag:", error);
  } finally {
    await admin.disconnect();
  }
}

export async function startConsumer() {
  if (!isConnected) {
    await consumer.connect();
    isConnected = true;
    consumerConnectionStatus.set(1);
    console.log("Kafka consumer connected");
  }

  const topic = process.env.KAFKA_TOPIC || "message-board";

  await consumer.subscribe({
    topic,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const partitionStr = partition.toString();
      const timer = consumerProcessingDuration.startTimer({
        topic,
        partition: partitionStr,
      });

      try {
        const value = message.value?.toString();
        if (!value) return;

        const parsedMessage: Message = JSON.parse(value);

        // Calculate time-based lag from message timestamp
        if (message.timestamp) {
          const messageTime = parseInt(message.timestamp, 10);
          const lagSeconds = (Date.now() - messageTime) / 1000;
          consumerLagSeconds.set(
            {
              topic,
              partition: partitionStr,
              consumer_group: groupId,
            },
            lagSeconds
          );
        }

        console.log("Consumed message:", {
          topic,
          partition,
          offset: message.offset,
          id: parsedMessage.id,
        });

        // Store message in Redis and publish to Pub/Sub
        await addMessage(parsedMessage);

        consumerMessagesConsumed.inc({
          topic,
          partition: partitionStr,
          status: "success",
        });
      } catch (error) {
        console.error("Error processing message:", error);
        consumerMessagesConsumed.inc({
          topic,
          partition: partitionStr,
          status: "error",
        });
      } finally {
        timer();
      }
    },
  });

  // Update consumer lag every 30 seconds
  lagUpdateInterval = setInterval(updateConsumerLag, 30000);
  // Initial lag update
  await updateConsumerLag();

  console.log(`Consumer subscribed to topic: ${topic}`);
}

export async function stopConsumer() {
  if (isConnected) {
    if (lagUpdateInterval) {
      clearInterval(lagUpdateInterval);
      lagUpdateInterval = null;
    }

    await consumer.disconnect();
    isConnected = false;
    consumerConnectionStatus.set(0);
    console.log("Kafka consumer disconnected");
  }
}
