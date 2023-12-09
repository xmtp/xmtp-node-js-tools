import { createClient } from "@redis/client"
import { RedisPersistence } from "@xmtp/redis-persistence"
import { Client } from "@xmtp/xmtp-js"
import { Wallet } from "ethers"

async function main() {
  const redis = createClient({
    url: "redis://localhost:6379",
  })
  await redis.connect()

  const wallet = Wallet.createRandom()
  const xmtp = await Client.create(wallet, {
    basePersistence: new RedisPersistence(redis, "xmtp:"),
    env: "production",
  })

  const conversation = await xmtp.conversations.newConversation(
    "0x93E2fc3e99dFb1238eB9e0eF2580EFC5809C7204",
  )

  await conversation.send("gm from the redis repo")

  // Load all messages in the conversation from the local cache
  const messages = await conversation.messages()

  // Print the messages
  messages.forEach((message) => {
    console.log(`[${message.senderAddress}]: ${message.content}`)
  })
}

main()
