# Bot Kit Pro

## Requirements

- A Postgres database (tested with version 13 and above)
- A set of XMTP keys for each bot you wish to deploy

## Running tests

1. `npm i`
2. `./dev/up`
3. `npm test`

## Usage

Here is a minimal example of using bot-kit-pro in your application:

```ts
import { newBotConfig, run } from "@xmtp/bot-kit-pro"

async function start() {
  const config = newBotConfig(
    "test",
    {
      xmtpEnv: "production",
      //   This will fail if environment variable is missing
      xmtpKeys: Buffer.from(process.env.XMTP_KEYS as string, "base64"),
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

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USERNAME`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

If no application config is specified, default values are provided that correspond with the DB in the `docker-compose.yml` file.

## Bot State Management

TODO

## Viewing Bot State

TODO
