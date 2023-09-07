import { GrpcApiClient } from "@xmtp/grpc-api-client"
import { Client } from "@xmtp/xmtp-js"
import { randomBytes } from "crypto"
import { eq } from "drizzle-orm"
import { Wallet } from "ethers"
import postgres from "postgres"

import Bot, { BotHandler, getOrCreateXmtpKeys } from "./bot.js"
import { newAppConfig, newBotConfig } from "./config.js"
import { buildDrizzle, doMigrations } from "./db/database.js"
import { findMostRecentMessage } from "./db/operations.js"
import { conversations, messages } from "./db/schema.js"
import { DB } from "./db/types.js"
import { PostgresPersistence } from "./persistence.js"

describe("Bot", () => {
  let keys: Uint8Array
  let dataSource: DB
  let dbConnection: postgres.Sql

  beforeAll(async () => {
    const appConfig = newAppConfig({})
    await doMigrations(appConfig.db)
    const { db, conn } = await buildDrizzle(appConfig.db)
    dataSource = db
    dbConnection = conn
  })

  afterAll(async () => {
    await dbConnection.end()
  })

  beforeEach(async () => {
    const wallet = Wallet.createRandom()
    keys = await Client.getKeys(wallet, {
      env: "dev",
      apiClientFactory: GrpcApiClient.fromOptions,
    })
  })

  const getConfig = (handler?: BotHandler) => {
    const botHandler = handler || (() => Promise.resolve())
    return newBotConfig(
      randomBytes(32).toString("hex"),
      {
        xmtpKeys: keys,
        xmtpEnv: "dev",
      },
      botHandler,
    )
  }

  it("can create", async () => {
    const config = getConfig()

    const bot = await Bot.create(config, dataSource)
    expect(bot).toBeDefined()
    expect(bot.name).toEqual(config.name)
  })

  it("can save a message", async () => {
    const config = getConfig()
    const bot = await Bot.create(config, dataSource)
    const otherClient = await Client.create(Wallet.createRandom(), {
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    const convo = await bot.client.conversations.newConversation(
      otherClient.address,
    )
    const message = await convo.send("hello world")
    await bot.saveMessage(message)
    const dbMessages = await bot.db
      .select()
      .from(messages)
      .where(eq(messages.botId, bot.name))
    expect(dbMessages).toHaveLength(1)
  })

  it("can handle messages", async () => {
    const config = getConfig(async (ctx) => {
      ctx.conversationState = { foo: "bar" }
      await ctx.reply("hello")
    })
    const bot = await Bot.create(config, dataSource)
    const otherClient = await Client.create(Wallet.createRandom(), {
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    await new Promise((resolve) => setTimeout(resolve, 100))
    const convo = await otherClient.conversations.newConversation(
      bot.client.address,
    )
    const msg = await convo.send("hello world")
    await bot.client.conversations.list()
    await bot.saveMessage(msg)
    await bot.db.transaction(async (tx) => {
      const dbMessage = await findMostRecentMessage(tx, msg.conversation.topic)
      if (!dbMessage) {
        throw new Error("message not found")
      }
      await bot.processMessage(tx, dbMessage)
    })

    const messages = await convo.messages()
    expect(messages).toHaveLength(2)

    const dbConvos = await bot.db
      .select()
      .from(conversations)
      .where(eq(conversations.topic, convo.topic))
      .limit(1)
    expect(dbConvos).toHaveLength(1)
    expect(dbConvos[0]).toBeDefined()
    expect(dbConvos[0].state.foo).toEqual("bar")
  })

  it("can load keys from the DB", async () => {
    const persistence = new PostgresPersistence(dataSource)
    const botName = randomBytes(32).toString("hex")
    const initialKeys = await getOrCreateXmtpKeys(botName, "dev", persistence)
    expect(initialKeys).toBeInstanceOf(Uint8Array)

    const retrievedKeys = await getOrCreateXmtpKeys(botName, "dev", persistence)
    expect(retrievedKeys).toBeInstanceOf(Uint8Array)
    expect([...retrievedKeys]).toEqual([...initialKeys])
  })
})
