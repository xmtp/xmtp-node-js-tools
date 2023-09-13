# redis-persistence

An example of a custom persistence layer that can be used for caching conversations in `xmtp-js` using Redis.

## Usage

```ts
import { RedisPersistence } from "@xmtp/redis-persistence"
import { Client } from "@xmtp/xmtp-js"
import { createClient } from "@redis/client"

const redis = createClient({
  url: "redis://localhost:6379",
})
await redis.connect()

const client = await Client.create(someWallet, {
  basePersistence: new RedisPersistence(redis, "xmtp:"),
})
```
