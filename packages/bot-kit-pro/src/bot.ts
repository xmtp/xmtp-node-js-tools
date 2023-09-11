import { GrpcApiClient } from "@xmtp/grpc-api-client"
import { Client, DecodedMessage, Persistence } from "@xmtp/xmtp-js"
import { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import pino from "pino"

import { BotConfig, BotCreateConfig } from "./config.js"
import HandlerContext from "./context.js"
import {
  findMostRecentMessage,
  findOrCreateBot,
  findOrCreateConversation,
  findUnprocessedMessages,
  getAndLockBot,
  getAndLockConversation,
  insertMessage,
  setBotState,
  setConversationState,
  setMessageNumRetries,
  setMessageStatus,
} from "./db/operations.js"
import { DB, Message as DBMessage } from "./db/types.js"
import { createLogger } from "./logger.js"
import { PostgresPersistence } from "./persistence.js"
import { Json } from "./types.js"
import { randomKeys, sleep } from "./utils.js"

export type BotHandler = (ctx: HandlerContext<Json, Json>) => Promise<void>

export default class Bot {
  // The bot name
  name: string
  // XMTP client
  client: Client
  // Database instance
  db: PostgresJsDatabase
  // Handler function
  handler: BotHandler
  // Message stream
  stream?: AsyncGenerator<DecodedMessage>
  // Prefixed logger
  logger: pino.Logger
  // The config used to instantiate the bot
  config: Required<BotConfig>
  // Whether the bot is currently running
  running = false

  constructor(
    name: string,
    client: Client,
    db: PostgresJsDatabase,
    config: Required<BotConfig>,
  ) {
    this.name = name
    this.client = client
    this.db = db
    this.handler = config.handler
    this.config = config
    this.logger = createLogger(
      // Always use JSON logging when NODE_ENV is production
      process.env.NODE_ENV === "production",
      "info",
      name,
      {
        walletAddress: this.client.address,
      },
    )
    if (this.client.apiClient instanceof GrpcApiClient) {
      this.client.apiClient.setLogger(this.logger)
    }
  }

  static async create(
    config: BotCreateConfig,
    datasource: PostgresJsDatabase,
  ): Promise<Bot> {
    const basePersistence = new PostgresPersistence(datasource)
    const xmtpKeys =
      config.xmtpKeys ||
      (await getOrCreateXmtpKeys(config.name, config.xmtpEnv, basePersistence))

    const client = await Client.create(null, {
      env: config.xmtpEnv,
      privateKeyOverride: xmtpKeys,
      basePersistence,
      disablePersistenceEncryption: true,
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    await findOrCreateBot(datasource, config.name)

    return new Bot(config.name, client, datasource, {
      ...config,
      xmtpKeys,
    })
  }

  async saveMessage(message: DecodedMessage) {
    this.logger.info({ messageId: message.id }, "Saving message")
    const dbConvo = await findOrCreateConversation(
      this.db,
      message.conversation.peerAddress,
      message.conversation.topic,
      this.name,
    )

    const dbMessage = await insertMessage(
      this.db,
      message,
      this.name,
      dbConvo.id,
      "unprocessed",
      null,
    )

    return {
      dbConvoId: dbConvo.id,
      dbMessageId: dbMessage.id,
      xmtpMessage: message,
    }
  }

  async processMessages() {
    await this.db.transaction(async (tx) => {
      const messages = await findUnprocessedMessages(tx, this.name, 3)

      for (const message of messages) {
        await this.processMessage(tx, message)
      }
    })
  }

  async processMessage(parentTx: DB, message: DBMessage) {
    const logger = this.logger.child({ messageId: message.id })
    await parentTx.transaction(async (tx) => {
      logger.info(`Processing message: ${message.contentsText}`)
      const bot = await getAndLockBot(tx, message.botId)

      const dbConvo = await getAndLockConversation(tx, message.conversationId)

      const xmtpMessage = await DecodedMessage.fromBytes(
        message.contents,
        this.client,
      )

      if (this.isExpired(xmtpMessage)) {
        logger.info("message has expired")
        return await setMessageStatus(tx, message.id, "expired")
      }

      const ctx = new HandlerContext(xmtpMessage, dbConvo.state, bot.state)
      try {
        await this.handler(ctx)
      } catch (err) {
        this.logger.error(err)
        return await setMessageNumRetries(
          tx,
          message.id,
          message.numRetries + 1,
        )
      }

      logger.debug(
        `conversation state: ${JSON.stringify(
          ctx.conversationState,
        )}\nbot state: ${JSON.stringify(ctx.botState)}`,
      )

      await setConversationState(tx, dbConvo.id, ctx.conversationState)
      await setBotState(tx, bot.id, ctx.botState)

      for (const reply of ctx.preparedReplies) {
        const sentMessage = await xmtpMessage.conversation.send(
          reply.content,
          reply.options,
        )
        logger.info(
          { replyId: sentMessage.id, contents: sentMessage.content },
          "Sent reply",
        )
        await insertMessage(
          tx,
          sentMessage,
          this.name,
          dbConvo.id,
          "reply",
          message.id,
        )
      }
      logger.info("successfully processed message")
      await setMessageStatus(tx, message.id, "processed")
    })
  }

  private async mostRecentMessage(topic: string): Promise<Date | null> {
    const msg = await findMostRecentMessage(this.db, topic)

    if (!msg) {
      return null
    }
    return msg.timestamp
  }

  private async initialize() {
    const convos = await this.client.conversations.list()
    this.logger.info(
      `Found ${convos.length} conversations. ${convos
        .map((c) => c.peerAddress)
        .join(", ")}`,
    )
    if (!this.config.skipMessageRefresh) {
      await Promise.all(
        convos.map(async (convo) => {
          const startTime = await this.mostRecentMessage(convo.topic)
          const messages = await convo.messages({
            // Start 10 seconds before the most recent message in the db to ensure we don't miss any
            startTime: startTime ? new Date(+startTime - 10 * 1000) : undefined,
          })
          if (messages.length > 2) {
            this.logger.warn(
              `Adding multiple messages (${messages.length}) from a single conversation to the DB`,
            )
          }

          for (const message of messages) {
            if (message.senderAddress === this.client.address) {
              continue
            }
            await this.saveMessage(message)
          }
        }),
      )
    }

    await this.processMessages()
  }

  async start() {
    this.logger.info(
      `Starting bot ${this.name} with address ${this.client.address}`,
    )
    this.running = true
    this.stream = await this.client.conversations.streamAllMessages()
    await this.initialize()

    this.retryProcessingLoop().then(
      () => this.logger.debug("retry loop ended"),
      () => this.logger.warn("retry loop failed"),
    )
    await this.listen()
  }

  private async listen() {
    if (!this.stream) {
      throw new Error("stream not initialized")
    }
    this.logger.info("stream listening started")
    for await (const message of this.stream) {
      if (message.senderAddress === this.client.address) {
        continue
      }
      await this.saveMessage(message)
      this.processMessages().then(
        () => this.logger.debug(`processed message: ${message.id}`),
        (err) => this.logger.error({ error: err }, "processing messages"),
      )
    }
    this.logger.info("stream listening ended")
  }

  private async retryProcessingLoop() {
    while (this.running) {
      try {
        await this.processMessages()
      } catch (e) {
        this.logger.error(`Error processing messages`, e)
      }
      await sleep(1000 * 10) // Wait 10 seconds between retries
    }
  }

  async stop() {
    this.logger.info("Shutting down bot")
    if (this.stream) {
      await this.stream.return(undefined)
      this.stream = undefined
    }
  }

  private isExpired(message: DecodedMessage) {
    return message.sent.getTime() + this.config.messageExpiryMs < Date.now()
  }
}

export async function getOrCreateXmtpKeys(
  name: string,
  env: string,
  persistence: Persistence,
): Promise<Uint8Array> {
  const key = `xmtp-keys/${env}/${name}`
  const existing = await persistence.getItem(key)
  if (existing) {
    return existing
  }
  const newKeys = await randomKeys()
  await persistence.setItem(key, newKeys)
  return newKeys
}
