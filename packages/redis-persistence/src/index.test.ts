import { RedisClientType, createClient } from "@redis/client"
import { randomBytes } from "crypto"
import { RedisPersistence } from "."

describe("RedisPersistence", () => {
  let redis: RedisClientType
  let persistence: RedisPersistence
  let keyPrefix: string
  beforeAll(async () => {
    redis = createClient({
      url: "redis://localhost:6379",
    })
    await redis.connect()
  })

  beforeEach(() => {
    keyPrefix = randomKey()
    persistence = new RedisPersistence(redis, keyPrefix)
  })

  afterAll(async () => {
    await redis.disconnect()
  })

  it("can write to a key", async () => {
    const value = Uint8Array.from([1, 2, 3])
    const key = randomKey()

    await persistence.setItem(key, value)
    const outValue = await persistence.getItem(key)
    expect(value).toEqual(outValue)
  })

  it("can overwrite a value", async () => {
    const initalValue = randomValue()
    const key = randomKey()
    await persistence.setItem(key, initalValue)
    const secondValue = randomValue()
    expect(await persistence.getItem(key)).toEqual(initalValue)
    await persistence.setItem(key, secondValue)
    expect(await persistence.getItem(key)).toEqual(secondValue)
  })

  it("respects the prefix", async () => {
    const key = randomKey()
    await persistence.setItem(key, randomValue())

    const fromRedisDirectly = await redis.get(keyPrefix + key)
    expect(fromRedisDirectly).not.toBeNull()
  })
})

function randomKey() {
  return randomBytes(32).toString("hex")
}

function randomValue() {
  return new Uint8Array(randomBytes(32))
}
