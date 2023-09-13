import { randomBytes } from "crypto"
import { beforeAll, describe, expect, it } from "vitest"

import { newAppConfig } from "./config"
import { buildDrizzle, doMigrations } from "./db/database"
import { PostgresPersistence } from "./persistence"
import { randomKeys } from "./utils"

describe("persistence", () => {
  let persistence: PostgresPersistence
  beforeAll(async () => {
    const appConfig = newAppConfig({})
    await doMigrations(appConfig.db)
    const { db, connection } = await buildDrizzle(appConfig.db)
    persistence = new PostgresPersistence(db)

    return async () => {
      await connection.end()
    }
  })

  it("allows setting and retrieving values", async () => {
    const key = randomBytes(32).toString("hex")
    const value = new TextEncoder().encode("bar")

    await persistence.setItem(key, value)
    expect(await persistence.getItem(key)).toEqual(value)
  })

  it("returns null for missing values", async () => {
    const key = randomBytes(32).toString("hex")

    expect(await persistence.getItem(key)).toBeNull()
  })

  it("allows overwriting values", async () => {
    const key = randomBytes(32).toString("hex")
    const firstValue = new TextEncoder().encode("foo")
    const secondValue = new TextEncoder().encode("bar")

    await persistence.setItem(key, firstValue)
    expect(await persistence.getItem(key)).toEqual(firstValue)

    await persistence.setItem(key, secondValue)
    expect(await persistence.getItem(key)).toEqual(secondValue)
  })

  it("round trips Uint8Array values", async () => {
    const persistenceKey = randomBytes(32).toString("hex")
    const keys = await randomKeys()
    await persistence.setItem(persistenceKey, keys)

    const returnedValue = await persistence.getItem(persistenceKey)
    if (!returnedValue) {
      throw new Error("could not retrieve from persistence")
    }
    expect([...returnedValue]).toEqual([...keys])
  })
})
