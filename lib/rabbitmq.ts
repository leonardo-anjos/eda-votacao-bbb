import amqp, { Connection, Channel, Message } from 'amqplib';

class RabbitMQManager {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isInitialized = false;

  private async initialize() {
    if (!this.isInitialized) {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
      this.isInitialized = true;
    }
  }

  public async getConnection(): Promise<Connection> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.connection!;
  }

  public async getChannel(): Promise<Channel> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.channel!;
  }

  public async enqueue(queue: string, message: object): Promise<void> {
    const channel = await this.getChannel();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log(`[rabbitmq] enqueued => ${queue}`);
  }

  public async consumeQueue(queue: string, onMessage: (msg: Message) => void): Promise<void> {
    const channel = await this.getChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.consume(queue, onMessage, { noAck: false });
  }

  public async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      console.log('[rabbitmq] channel closed');
    }
    if (this.connection) {
      await this.connection.close();
      console.log('[rabbitmq] connection closed');
    }
  }
}

const rabbitMQManager = new RabbitMQManager();
export default rabbitMQManager;
