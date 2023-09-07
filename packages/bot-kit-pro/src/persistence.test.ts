import { randomBytes } from "crypto"

import { newAppConfig } from "./config"
import { buildDataSource } from "./dataSource"
import { FsPersistence, PostgresPersistence } from "./persistence"
import { randomKeys } from "./utils"

describe("persistence", () => {
  let persistence: PostgresPersistence

  beforeAll(async () => {
    persistence = new PostgresPersistence(
      await buildDataSource(newAppConfig({})).initialize(),
    )
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

describe("fs persistence", () => {
  let persistence: FsPersistence

  beforeEach(async () => {
    const folder = `/tmp/${randomBytes(32).toString("hex")}`
    persistence = new FsPersistence(folder)
  })

  it("allows setting and retrieving values", async () => {
    const key = "foo"
    const value = new TextEncoder().encode("bar")

    await persistence.setItem(key, value)
    const returnedValue = await persistence.getItem(key)
    if (!returnedValue) {
      throw new Error("no returned value")
    }
    expect(returnedValue).toEqual(value)
  })

  it("returns null for missing values", async () => {
    expect(await persistence.getItem("foo")).toBeNull()
  })
})
