# XMTP Bot Starter

> ⚠️ Bot Starter has been deprecated. To get started building Bots with XMTP head to [BotKit](https://github.com/xmtp/botkit).

## Usage

First, install the package in your project:

```bash
yarn add @xmtp/bot-starter
```

Here's a basic example of how to use the package:

```typescript
import run from "@xmtp/bot-starter"

run(async (context) => {
const messageBody = context.message.content
await context.reply(ECHO: ${messageBody})
})

```

#### Keeping the same address (the `KEY` environment variable)

By default, your bot will have a new address every time you start it up. That's ideal. If you have a private key, you can encode it to a hex string and set the `KEY` environment variable. Your bot will then use this key to connect to the network.

Don't know how to create a private key? Here's how to do it with ethers.js:

```jsx
import { Wallet } from "ethers"

const key = Wallet.createRandom().privateKey
console.log("Set your environment variable: KEY=" + key)
```

### XMTP Environment (the `XMTP_ENV` environment variable)

By default, the bot connects to the `dev` network. If you want to connect to production, specify `XMTP_ENV=production`.

#### Development

If you want to contribute to this package, here are the steps to set up the project for development:

Install the necessary packages and build the project:

```bash
yarn install
yarn build
```

Run the file echo under examples

```bash
examples/run echo
```

```typescript
// Call `run` with a handler function. The handler function is called
// with a HandlerContext
run(async (context) => {
  // When someone sends your bot a message, you can get the DecodedMessage
  // from the HandlerContext's `message` field
  const messageBody = context.message.content

  // To reply, just call `reply` on the HandlerContext.
  await context.reply(`ECHO: ${messageBody}`)
})
```
