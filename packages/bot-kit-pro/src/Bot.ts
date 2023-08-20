import pino from "pino"
import { Client, DecodedMessage } from "@xmtp/xmtp-js"
import { EntityManager, ObjectLiteral, EntityTarget } from "typeorm"
import { AppDataSource } from "./dataSource.js"
import {
  Conversation,
  findOrCreateConversation,
} from "./models/Conversation.js"
import { Bot as BotDB, findOrCreateBot } from "./models/Bot.js"
import { InboundMessage, Reply } from "./models/Message.js"
import HandlerContext from "./HandlerContext.js"
import GrpcApiClient from "./GrpcApiClient.js"
import { BotConfig } from "./config.js"
import { createLogger } from "./logger.js"
import { Json } from "./types.js"
import { PostgresPersistence } from "./persistence.js"

export type BotHandler = (ctx: HandlerContext<Json, Json>) => Promise<void>

export default class Bot {
  name: string
  client: Client
  db: typeof AppDataSource
  botRecord: BotDB
  handler: BotHandler
  stream?: AsyncGenerator<DecodedMessage>
  logger: pino.Logger

  constructor(
    name: string,
    client: Client,
    db: typeof AppDataSource,
    botRecord: BotDB,
    handler: BotHandler,
  ) {
    this.name = name
    this.client = client
    this.db = db
    this.botRecord = botRecord
    this.handler = handler
    this.logger = createLogger(
      process.env.NODE_ENV === "production",
      "info",
      this.botRecord.id,
      {
        walletAddress: this.client.address,
      },
    )
  }

  static async create(
    configInput: BotConfig,
    datasource: typeof AppDataSource,
  ): Promise<Bot> {
    const config = applyDefaults(configInput)

    const client = await Client.create(null, {
      env: config.xmtpEnv,
      privateKeyOverride: config.xmtpKeys,
      basePersistence: new PostgresPersistence(datasource),
      disablePersistenceEncryption: true,
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    const repo = datasource.getRepository(BotDB)
    const botRecord = await findOrCreateBot(repo, config.name)
    if (!botRecord) {
      throw new Error("Bot not found")
    }

    return new Bot(config.name, client, datasource, botRecord, config.handler)
  }

  private getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>) {
    return this.db.getRepository(entity)
  }

  async saveMessage(message: DecodedMessage) {
    const dbConvo = await findOrCreateConversation(
      this.getRepository(Conversation),
      message.conversation.peerAddress,
      message.conversation.topic,
      this.botRecord.id,
    )

    const dbMessage = await this.getRepository(InboundMessage)
      .createQueryBuilder()
      .insert()
      .values({
        messageId: message.id,
        contents: Buffer.from(message.toBytes()),
        bot: this.botRecord,
        conversation: dbConvo,
        numRetries: 0,
        timestamp: message.sent,
      })
      .orIgnore()
      .execute()
    this.logger.info({ dbMessage, dbConvo }, `Saved message ${message.id}`)

    return {
      dbConvoId: dbConvo.id,
      dbMessageId: dbMessage.identifiers[0]?.id,
      xmtpMessage: message,
    }
  }

  async processMessages() {
    await this.db.transaction(async (parentEntityManager) => {
      const messages = await parentEntityManager
        .getRepository(InboundMessage)
        .createQueryBuilder("msg")
        .setLock("pessimistic_write")
        .where("msg.processed = FALSE")
        .andWhere("msg.numRetries < :maxRetries", { maxRetries: 3 })
        .andWhere("msg.botId = :id", { id: this.botRecord.id })
        .orderBy("msg.timestamp", "ASC")
        .getMany()

      for (const message of messages) {
        await this.processMessage(parentEntityManager, message)
      }
    })
  }

  async processMessage(
    parentEntityManager: EntityManager,
    message: InboundMessage,
  ) {
    await parentEntityManager.transaction(async (entityManager) => {
      const bot = await entityManager
        .getRepository(BotDB)
        .createQueryBuilder("bot")
        .setLock("pessimistic_write")
        .where("bot.id = :id", { id: this.botRecord.id })
        .getOneOrFail()

      const dbConvo = await entityManager
        .getRepository(Conversation)
        .createQueryBuilder("convo")
        .setLock("pessimistic_write")
        .where("convo.id = :id", { id: message.conversationId })
        .getOneOrFail()

      const xmtpMessage = await DecodedMessage.fromBytes(
        message.contents,
        this.client,
      )

      const ctx = new HandlerContext(xmtpMessage, dbConvo.state, bot.state)
      try {
        await this.handler(ctx)
      } catch (err) {
        this.logger.error(err)
        await entityManager.update(InboundMessage, message.id, {
          numRetries: message.numRetries + 1,
        })
        return
      }

      this.logger.info(
        `conversation state: ${JSON.stringify(
          ctx.conversationState,
        )}\nbot state: ${JSON.stringify(ctx.botState)}`,
      )
      await entityManager.update(Conversation, dbConvo.id, {
        state: ctx.conversationState,
      })
      await entityManager.update(BotDB, bot.id, {
        state: ctx.botState,
      })

      for (const reply of ctx.preparedReplies) {
        const sentMessage = await xmtpMessage.conversation.send(
          reply.content,
          reply.options,
        )
        const dbReply = Reply.fromXmtpMessage(
          sentMessage,
          message,
          message.bot,
          dbConvo,
        )
        await entityManager.insert(Reply, dbReply)
      }
      await entityManager.update(InboundMessage, message.id, {
        processed: true,
      })
    })
  }

  private async mostRecentMessage(topic: string): Promise<Date | null> {
    const msg = await this.getRepository(InboundMessage)
      .createQueryBuilder("mostRecent")
      .innerJoin("mostRecent.conversation", "convo")
      .where("convo.topic = :topic", { topic })
      .orderBy("mostRecent.timestamp", "DESC")
      .getOne()

    if (!msg) {
      return null
    }
    return msg.timestamp
  }

  private async initialize() {
    const convos = await this.client.conversations.list()
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

    await this.processMessages()
  }

  async start() {
    this.logger.info(
      `Starting bot ${this.botRecord.id} with address ${this.client.address}`,
    )
    await this.initialize()
    this.stream = await this.client.conversations.streamAllMessages()
    for await (const message of this.stream) {
      if (message.senderAddress === this.client.address) {
        continue
      }
      await this.saveMessage(message)
      this.processMessages().then(
        () => this.logger.debug(`processed message: ${message.id}`),
        (err) => console.error(err),
      )
    }
  }

  async stop() {
    this.logger.info("Shutting down bot")
    if (this.stream) {
      await this.stream.return(undefined)
      this.stream = undefined
    }
  }
}

function applyDefaults(config: BotConfig): Required<BotConfig> {
  return {
    xmtpEnv: "production",
    messageExpiryMs: 1000 * 60 * 30, // 30 minutes
    ...config,
  }
}
