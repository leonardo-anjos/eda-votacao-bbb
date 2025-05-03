import { prisma } from '../../../../lib/prisma'
import rabbitMQManager from '../../../../lib/rabbitmq'

const votesBuffer: { participant: string }[] = []
const BATCH_SIZE = process.env.BATCH_SIZE || 10
const WORKERS = process.env.WORKERS || 1

const RABBITMQ_QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || 'votes'

async function saveVotesBatch(workerId: number) {
  if (votesBuffer.length === 0) return;

  const votesToSave = [...votesBuffer];
  votesBuffer.length = 0;

  try {
    await prisma.vote.createMany({
      data: votesToSave.map((vote) => ({
        participant: vote.participant,
        createdAt: new Date(),
      })),
    });
    console.log(`[worker-${workerId}] ${votesToSave.length} votes saved to the database`);
  } catch (error) {
    console.error('[worker-${workerId}] error saving votes in batch:', error);
  }
}

async function processVoteMessage(workerId: number, msg: any, channel: any) {
  if (msg) {
    try {
      const data = JSON.parse(msg.content.toString());
      votesBuffer.push({ participant: data.participant });
      console.log(`[worker-${workerId}] dequeued => ${data.participant}`);
      if (votesBuffer.length >= +BATCH_SIZE) {
        await saveVotesBatch(workerId);
      }
      // acknowledge the message using the channel
      channel.ack(msg);
    } catch (error) {
      console.error(`[worker-${workerId}] error processing message:`, error);
      // optionally, reject the message
      channel.nack(msg); // use channel.nack(msg, false, true) to requeue the message
    }
  }
}

async function startWorker(workerId: number) {
  console.log(`[worker-${workerId}] starting. listening ${RABBITMQ_QUEUE_NAME}`);
  const channel = await rabbitMQManager.getChannel(); // get channel
  await channel.consume(RABBITMQ_QUEUE_NAME, (msg: any) => processVoteMessage(workerId, msg, channel));
}

// start multiple workers in parallel
for (let i = 0; i < +WORKERS; i++) {
  startWorker(i+1).catch(console.error)
}
