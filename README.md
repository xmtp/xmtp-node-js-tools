# 🤖 Bot Kit Pro 🤖

Bot Kit Pro is a production-ready framework for running bots on the XMTP network. It is designed to enable complex workflows

## Features

### 📒 State Storage

Every bot and conversation has a JSON state object that you can write to from inside your bot handler. Keep track of values between messages to build complex conversation workflows.

### 💪 High Reliability

Bot Kit Pro connects to the XMTP network via GRPC for reliable, high performance, message streaming. Every message is stored in a database to ensure that messages are only processed once. If your bot is offline for a period of time it will fill in missing messages to ensure every message gets processed. You can also run multiple instances of your bot in parallel to allow for 0-downtime deploys.

### 🛢️ High Performance Conversation Store

A common complaint from developers using XMTP to build bots is the high cost of running `client.conversations.list()` after restarting your application. We've added a database-backed cache to make sure your application only ever has to decrypt a conversation one time ever.

### 🔎 Designed For Auditability

No more poring over server logs. Because every incoming and outgoing message is stored in a database, you can build admin pages using tools like Retool to view the history of your bot's replies.

## Packages

This repo contains the following packages

- [Bot Kit Pro](./packages/bot-kit-pro/README.md)
- [GRPC API CLient](./packages/grpc-api-client/README.md)
- [Bot Examples](./packages/bot-examples/)

## Usage

Let's create a simple bot that uses both the `botState` and `conversationState` to keep track of a waitlist for an event.

```ts
import { HandlerContext, newBotConfig, run } from "@xmtp/bot-kit-pro"

type BotState = {
  waitListLength?: number
}

type ConvoState = {
  isOnWaitlist?: boolean
}
/**
 * A simple bot that adds each user to a waitlist and keeps track of how many members are ahead of them
 */
function waitlist(ctx: HandlerContext<ConvoState, BotState>) {
  // Check the conversation state to see if the user has already been added
  if (ctx.conversationState.isOnWaitlist) {
    return ctx.reply("You're already on the waitlist!")
  }
  // Increment the waitListLength variable for the new member
  ctx.botState.waitListLength = (ctx.botState.waitListLength || 0) + 1

  ctx.conversationState.isOnWaitlist = true
  //   Send a reply
  ctx.reply(
    `You are on the waitlist in position ${ctx.botState.waitListLength}`,
  )
}

const config = newBotConfig(
  "waitlist",
  {
    xmtpKeys: process.env.XMTP_KEYS,
    xmtpEnv: "dev",
  },
  waitlist,
)
```
