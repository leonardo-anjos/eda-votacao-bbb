import amqp from 'amqplib'
import { prisma } from '../lib/prisma'
import { createConnection, createChannel, consumeQueue } from '../lib/rabbitmq'

const votesBuffer: { participant: string }[] = []
const BATCH_SIZE = process.env.BATCH_SIZE || 10
const CONCURRENCY = process.env.CONCURRENCY || 1
const WORKERS = process.env.WORKERS || 1

async function saveVotesBatch() {
  if (votesBuffer.length === 0) return

  const votesToSave = [...votesBuffer]
  votesBuffer.length = 0

  try {
    await prisma.vote.createMany({
      data: votesToSave.map(vote => ({
        participant: vote.participant,
        createdAt: new Date(),
      })),
    })
    console.log(`[Batch Insert] ${votesToSave.length} votes saved to the database!`)
  } catch (error) {
    console.error('Error saving votes in batch:', error)
  }
}

async function processMessage(msg: amqp.Message) {
  if (msg) {
    try {
      const data = JSON.parse(msg.content.toString())
      votesBuffer.push({
        participant: data.participant,
      })

      console.log(`Vote received for => ${data.participant}`)

      if (votesBuffer.length >= BATCH_SIZE) {
        await saveVotesBatch()
      }

    } catch (error) {
      console.error('Error processing message:', error)
    }
  }
}

async function startWorker() {
  const connection = await createConnection()
  const channel = await createChannel(connection)

  console.log('Worker started...')

  channel.prefetch(+CONCURRENCY)

  consumeQueue(channel, async (msg) => {
    await processMessage(msg)
    channel.ack(msg)
  })
}

// start multiple workers in parallel
for (let i = 0; i < +WORKERS; i++) {
  startWorker().catch(console.error)
}
