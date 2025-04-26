import amqp from 'amqplib';
import { saveVote } from '../memory-store';

const queue = 'votes';

async function startWorker() {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue(queue, { durable: true });

  console.log('worker started...');
  channel.consume(queue, (msg) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      saveVote(data.participant);
      console.log(`1 vote for => ${data.participant}`);
      channel.ack(msg);
    }
  });
}

startWorker().catch(console.error);
