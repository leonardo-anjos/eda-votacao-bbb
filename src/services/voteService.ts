import amqp from 'amqplib';

const queue = 'votes';

export async function sendVoteToQueue(participant: string) {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();

  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify({ participant })), {
    persistent: true,
  });

  setTimeout(() => {
    conn.close();
  }, 500);
}
