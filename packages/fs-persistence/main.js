import { Client } from "@xmtp/xmtp-js"
import { Wallet } from "ethers"
import { FsPersistence } from "@xmtp/fs-persistence"

async function main() {
  const wallet = Wallet.createRandom()
  const xmtp = await Client.create(wallet, {
    basePersistence: new FsPersistence("/tmp/xmtp"),
    env: "production",
  })

  const conversation = await xmtp.conversations.newConversation(
    "0x93E2fc3e99dFb1238eB9e0eF2580EFC5809C7204",
  )

  await conversation.send("gm from the fs repo")

  // Load all messages in the conversation from the local cache
  const messages = await conversation.messages()

  // Print the messages
  messages.forEach((message) => {
    console.log(`[${message.senderAddress}]: ${message.content}`)
  })
}

main()
