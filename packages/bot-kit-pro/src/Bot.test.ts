import { Client } from "@xmtp/xmtp-js"
import Bot, { BotHandler } from "./Bot.js"
import { BotConfig } from "./config.js"
import { Wallet } from "ethers"
import { randomBytes } from "crypto"
import { AppDataSource } from "./dataSource.js"
import { InboundMessage } from "./models/Message.js"
import { Conversation } from "./models/Conversation.js"
import GrpcApiClient from "./GrpcApiClient.js"

describe("Bot", () => {
  let keys: Uint8Array
  let dataSource: typeof AppDataSource

  beforeAll(async () => {
    dataSource = await AppDataSource.initialize()
  })

  beforeEach(async () => {
    const wallet = Wallet.createRandom()
    keys = await Client.getKeys(wallet, {
      env: "dev",
      apiClientFactory: GrpcApiClient.fromOptions,
    })
  })

  const getConfig = (handler?: BotHandler): BotConfig => {
    return {
      name: randomBytes(32).toString("hex"),
      xmtpKeys: keys,
      xmtpEnv: "dev",
      handler: handler || (() => Promise.resolve()),
    }
  }

  it("can create", async () => {
    const config = getConfig()

    const bot = await Bot.create(config, dataSource)
    expect(bot).toBeDefined()
    expect(bot.botRecord.id).toEqual(config.name)
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
    const messages = await bot.db.getRepository(InboundMessage).find({
      where: { bot: { id: bot.botRecord.id } },
    })
    expect(messages).toHaveLength(1)
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
    await bot.db.transaction(async (manager) => {
      const dbMessage = await manager.findOneOrFail(InboundMessage, {
        where: { messageId: msg.id },
      })
      await bot.processMessage(manager, dbMessage)
    })

    const messages = await convo.messages()
    expect(messages).toHaveLength(2)

    const dbConvo = await bot.db.getRepository(Conversation).findOneOrFail({
      where: { topic: convo.topic },
    })
    expect(dbConvo).toBeDefined()
    expect(dbConvo.state.foo).toEqual("bar")
  })
})
