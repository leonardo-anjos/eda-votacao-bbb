import amqp, { Connection, Channel, Message } from 'amqplib'

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost'
const QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || 'votes'

export async function createConnection(): Promise<Connection> {
  try {
    const connection = await amqp.connect(RABBITMQ_URL)
    console.log('Connected to RabbitMQ')
    return connection
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error)
    throw new Error('Failed to connect to RabbitMQ')
  }
}

export async function createChannel(connection: Connection): Promise<Channel> {
  try {
    const channel = await connection.createChannel()
    console.log('Channel created')
    
    await channel.assertQueue(QUEUE_NAME, { durable: true })
    console.log(`Queue '${QUEUE_NAME}' is ready`)
    
    return channel
  } catch (error) {
    console.error('Failed to create a channel:', error)
    throw new Error('Failed to create a channel')
  }
}

export function consumeQueue(channel: Channel, callback: (msg: Message | null) => void) {
  channel.consume(QUEUE_NAME, (msg) => {
    if (msg) {
      console.log('Message received:', msg.content.toString())
      callback(msg)
    }
  }, {
    noAck: false
  })
}
