# Bot Kit Pro

## Requirements

- A Postgres database (tested with version 13 and above)
- `yarn` package manager version 2.x or 3.x

## Running tests

1. `yarn`
2. `./dev/up`
3. `yarn test`

## Usage

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

TODO

## Viewing Bot State

TODO
