# Bot Kit Pro

Bot Kit Pro is a database-backed bot framework for running high reliability XMTP bots. It provides a simple way to create, configure, and run bots with a focus on reliability and state management.

### Requirements

- A Postgres database (tested with version 13 and above)
- Docker running
- `yarn` package manager version 2.x or 3.x

### Running tests

1. `yarn`
2. Open docker
3. `./dev/up`
4. `yarn test`

### Usage

Here is a minimal example of using bot-kit-pro in your application:

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

## Configuration

### Bot Configuration

Each bot expects a configration, which can be created using `newBotConfig`.

You can also optionally provide application-level configuration to specify howt he database connection is established. The following environment variables are respected for app level configuration, and take precedence over any configuration values provided in code.

- `POSTGRES_CONNECTION_STRING`

If no application config is specified, default values are provided that correspond with the DB in the `docker-compose.yml` file.

## Bot State Management

Bot state management is handled by the framework. The state of each bot and conversation is stored in the database, allowing for reliable recovery in case of failures. The state can be accessed and modified in the bot handler function.

## Viewing Bot State

The state of the bots and conversations can be viewed directly in the Postgres database. The [bots](package.json#4%2C85-4%2C85), [conversations](src/bot.test.ts#12%2C10-12%2C10), and [messages](src/bot.test.ts#12%2C25-12%2C25) tables contain the relevant information.
