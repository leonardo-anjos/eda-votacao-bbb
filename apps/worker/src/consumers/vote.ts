import amqp from 'amqplib'
import { prisma } from '../lib/prisma'

const queue = 'votes'
const votesBuffer: { participant: string }[] = []  // buffer to store votes
const BATCH_SIZE = process.env.BATCH_SIZE || 1  // number of votes to save at once

async function saveVotesBatch() {
  if (votesBuffer.length === 0) return

  const votesToSave = [...votesBuffer]  // create a copy of the votes
  votesBuffer.length = 0  // clear the buffer after saving

  try {
    // inset votes in batch
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

async function startWorker() {
  const conn = await amqp.connect('amqp://localhost')
  const channel = await conn.createChannel()
  await channel.assertQueue(queue, { durable: true })

  console.log('Worker started...')

  channel.consume(queue, async (msg) => {
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

        channel.ack(msg)
      } catch (error) {
        console.error('Error processing message:', error)
        channel.nack(msg, false, false)
      }
    }
  })
}

// start the worker
startWorker().catch(console.error)

// save any remaining votes when the process is terminated
process.on('SIGINT', async () => {
  console.log('Saving pending votes...')
  await saveVotesBatch()
  process.exit()
})

process.on('SIGTERM', async () => {
  console.log('Saving pending votes...')
  await saveVotesBatch()
  process.exit()
})
