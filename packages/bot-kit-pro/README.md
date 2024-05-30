# Bot Kit Pro

> To get started building Bots with XMTP head first to [BotKit](https://github.com/xmtp/botkit).

Bot Kit Pro is an advanced framework designed for complex workflows that require high reliability.

### 📒 State Storage

Every bot and conversation has a JSON state object you can write to from inside your bot handler. Keep track of values between messages to build complex conversation workflows.

### 💪 High reliability

Bot Kit Pro connects to the XMTP network via GRPC for reliable, high-performance message streaming. Every message is stored in a database to ensure that messages are processed only once. If your bot is offline for some time, it will fill in missing messages to ensure every message gets processed. You can also run multiple instances of your bot in parallel to allow for zero-downtime deploys.

### 🛢️ High-performance conversation store

A common complaint from developers using XMTP to build bots is the high cost of running `client.conversations.list()` after restarting their apps. We added a database-backed cache so that apps need to decrypt a conversation only once.

### 🔎 Designed For auditability

No more poring over server logs. Because every incoming and outgoing message is stored in a database, you can build admin pages using tools like Retool to view the history of your bot's replies.

## 👨🏼‍🔧 Bot State Management

Bot state management is handled by the framework. The state of each bot and conversation is stored in the database, allowing for reliable recovery in case of failures. The state can be accessed and modified in the bot handler function.

### Usage

Here is a minimal example of using bot-kit-pro in your application:

```yarn
yarn install @xmtp/bot-kit-pro
```

```ts
import { newBotConfig, run } from "@xmtp/bot-kit-pro"

async function start() {
  const config = newBotConfig(
    "test",
    {
      xmtpEnv: "production",
    },
    async (ctx) => {
      ctx.reply("hi")
    },
  )

  await run([config])
}

start()
```

### Development

- A Postgres database (tested with version 13 and above)
- Docker running
- `yarn` package manager version 2.x or 3.x or 4.x

Once you have these requirements, you can use this mono repo for testing and development

```bash
# go into the package
cd packages/bot-kit-pro

# install dependencies
yarn install

# running the bot
./dev/up
```

- This will start the Docker container with the Postgres database and set up the necessary environment.

### Bot Configuration

Each bot expects a configration, which can be created using `newBotConfig`.

You can also optionally provide application-level configuration to specify howt he database connection is established. The following environment variables are respected for app level configuration, and take precedence over any configuration values provided in code.

- `POSTGRES_CONNECTION_STRING`

If no application config is specified, default values are provided that correspond with the DB in the `docker-compose.yml` file.

### Viewing Bot State

The state of the bots and conversations can be viewed directly in the Postgres database. The [bots](package.json#4%2C85-4%2C85), [conversations](src/bot.test.ts#12%2C10-12%2C10), and [messages](src/bot.test.ts#12%2C25-12%2C25) tables contain the relevant information.

### Running tests

1. `yarn`
2. Open docker
3. `./dev/up`
4. `yarn test`
