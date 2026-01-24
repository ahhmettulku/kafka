import { CompressionTypes } from "kafkajs";
import kafka from "./client";
import { Message } from "./types";
import {
  producerMessagesSent,
  producerSendDuration,
  producerConnectionStatus,
  producerMessagesSizeBytes,
} from "@/lib/metrics/kafka-metrics";

const producer = kafka.producer();

let isConnected = false;

export async function connectProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    producerConnectionStatus.set(1);
    console.log("Kafka producer connected");
  }
}

export async function sendMessage(message: Message) {
  await connectProducer();

  const topic = process.env.KAFKA_TOPIC || "message-board";
  const timer = producerSendDuration.startTimer({ topic });

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: message.id,
          value: JSON.stringify(message),
          timestamp: message.timestamp.toString(),
        },
      ],
      compression: CompressionTypes.GZIP,
    });

    producerMessagesSent.inc({ topic, status: "success" });
    producerMessagesSizeBytes.observe(
      {
        topic,
      },
      Buffer.byteLength(JSON.stringify(message), "utf8"),
    );
    console.log(`Message sent to topic ${topic}:`, message.id);
  } catch (error) {
    producerMessagesSent.inc({ topic, status: "error" });
    throw error;
  } finally {
    timer();
  }
}

export async function disconnectProducer() {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
    producerConnectionStatus.set(0);
    console.log("Kafka producer disconnected");
  }
}
