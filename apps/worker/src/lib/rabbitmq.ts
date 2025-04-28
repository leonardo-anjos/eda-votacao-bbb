import amqp, { Channel, Connection } from 'amqplib'

let connection: Connection
let channel: Channel

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost'

export async function connectRabbitMQ() {
  if (connection && channel) {
    return { connection, channel }
  }

  connection = await amqp.connect(RABBITMQ_URL)
  channel = await connection.createChannel()

  console.log('[RabbitMQ] Conectado com sucesso!')

  return { connection, channel }
}

/**
 * Consome uma fila no RabbitMQ
 * @param queue Nome da fila
 * @param onMessage Função para processar cada mensagem
 */
export async function consumeQueue(queue: string, onMessage: (message: amqp.ConsumeMessage) => Promise<void>) {
  const { channel } = await connectRabbitMQ()

  await channel.assertQueue(queue, {
    durable: true,  // Garante que a fila persista se o RabbitMQ reiniciar
  })

  await channel.consume(queue, async (message) => {
    if (!message) {
      console.warn('[RabbitMQ] Mensagem nula recebida.')
      return
    }

    try {
      await onMessage(message)
      channel.ack(message)  // Confirma que processamos a mensagem
    } catch (error) {
      console.error('[RabbitMQ] Erro ao processar mensagem:', error)
      // Opcional: NACK com requeue
      channel.nack(message, false, true)
    }
  })

  console.log(`[RabbitMQ] Consumindo fila: ${queue}`)
}
