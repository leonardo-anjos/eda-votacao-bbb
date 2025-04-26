import amqp, { Connection, Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const RABBITMQ_PREFETCH = parseInt(process.env.RABBITMQ_PREFETCH || '10', 10);

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  if (!connection) {
    connection = await amqp.connect(RABBITMQ_URL);
  }

  if (!channel) {
    channel = await connection.createChannel();
    channel.prefetch(RABBITMQ_PREFETCH);
  }

  return channel;
};

process.on('exit', async () => {
  if (channel) {
    await channel.close();
    console.log('[x] RabbitMQ channel closed');
  }
  if (connection) {
    await connection.close();
    console.log('[x] RabbitMQ connection closed');
  }
});