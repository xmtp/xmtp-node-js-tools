import type { RedisClientType } from "@redis/client"
import { commandOptions } from "@redis/client"
import type { Persistence } from "@xmtp/xmtp-js"

export class RedisPersistence implements Persistence {
  redis: RedisClientType
  keyPrefix: string

  constructor(redis: RedisClientType, keyPrefix: string) {
    this.redis = redis
    this.keyPrefix = keyPrefix
  }

  async getItem(key: string): Promise<Uint8Array | null> {
    const value = await this.redis.get(
      commandOptions({ returnBuffers: true }),
      this.keyPrefix + key,
    )
    return value ? new Uint8Array(value) : null
  }

  async setItem(key: string, value: Uint8Array): Promise<void> {
    await this.redis.set(this.keyPrefix + key, Buffer.from(value))
  }
}
