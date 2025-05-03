import rabbitMQManager from '../../../../lib/rabbitmq';

const queue = process.env.RABBITMQ_QUEUE_NAME || 'votes';

export async function sendVoteToQueue(participant: string) {
  await rabbitMQManager.enqueue(queue, { participant });
}
