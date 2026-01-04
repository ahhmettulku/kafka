export interface Message {
  id: string;
  content: string;
  author: string;
  timestamp: number;
}

export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  value: Message;
}
