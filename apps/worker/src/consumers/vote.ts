import amqp from 'amqplib'
import { prisma } from '../lib/prisma'
import { createConnection, createChannel, consumeQueue } from '../lib/rabbitmq'

const votesBuffer: { participant: string }[] = []
const BATCH_SIZE = process.env.BATCH_SIZE || 10
const CONCURRENCY = process.env.CONCURRENCY || 1
const WORKERS = process.env.WORKERS || 1

// Function to save votes in batches
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

// Function to handle processing of each message
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

      // Acknowledge the message after processing
    } catch (error) {
      console.error('Error processing message:', error)
    }
  }
}

// Function to start the worker and consume messages with concurrency control
async function startWorker() {
  const connection = await createConnection()
  const channel = await createChannel(connection)

  console.log('Worker started...')

  // Set the prefetch value to control how many messages a consumer will handle at once
  channel.prefetch(+CONCURRENCY)

  consumeQueue(channel, async (msg) => {
    await processMessage(msg)  // Process each message
    channel.ack(msg)  // Acknowledge the message after processing
  })
}

// Start multiple workers in parallel
for (let i = 0; i < +WORKERS; i++) {
  startWorker().catch(console.error)  // Start 3 workers (adjust the number as needed)
}
