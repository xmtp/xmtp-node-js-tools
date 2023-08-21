import { newAppConfig } from "./config"
import { buildDataSource } from "./dataSource"
import { PostgresPersistence } from "./persistence"
import { randomBytes } from "crypto"

describe("persistence", () => {
  let persistence: PostgresPersistence

  beforeAll(async () => {
    persistence = new PostgresPersistence(
      await buildDataSource(newAppConfig({})).initialize(),
    )
  })

  it("allows setting and retrieving values", async () => {
    const key = randomBytes(32).toString("hex")
    const value = Buffer.from(new TextEncoder().encode("bar"))

    await persistence.setItem(key, value)
    expect(await persistence.getItem(key)).toEqual(value)
  })

  it("returns null for missing values", async () => {
    const key = randomBytes(32).toString("hex")

    expect(await persistence.getItem(key)).toBeNull()
  })

  it("allows overwriting values", async () => {
    const key = randomBytes(32).toString("hex")
    const firstValue = Buffer.from(new TextEncoder().encode("foo"))
    const secondValue = Buffer.from(new TextEncoder().encode("bar"))

    await persistence.setItem(key, firstValue)
    expect(await persistence.getItem(key)).toEqual(firstValue)

    await persistence.setItem(key, secondValue)
    expect(await persistence.getItem(key)).toEqual(secondValue)
  })
})
