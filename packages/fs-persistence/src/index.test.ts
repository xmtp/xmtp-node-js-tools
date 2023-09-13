import { randomBytes } from "crypto"
import { beforeEach, describe, expect, it } from "vitest"

import { FsPersistence } from "."

describe("fs persistence", () => {
  let persistence: FsPersistence

  beforeEach(async () => {
    const folder = `/tmp/${randomBytes(32).toString("hex")}`
    persistence = new FsPersistence(folder)
  })

  it("allows setting and retrieving values", async () => {
    const key = "foo"
    const value = toBytes("bar")

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

  it("allows for slashes in values", async () => {
    const key1 = "a"
    const key2 = "a/b"
    const key3 = "a/b/c"
    const value1 = toBytes("1")
    const value2 = toBytes("2")
    const value3 = toBytes("3")

    await persistence.setItem(key1, value1)
    await persistence.setItem(key2, value2)
    await persistence.setItem(key3, value3)

    const [returned1, returned2, returned3] = await Promise.all([
      persistence.getItem(key1),
      persistence.getItem(key2),
      persistence.getItem(key3),
    ])
    expect(returned1).toEqual(value1)
    expect(returned2).toEqual(value2)
    expect(returned3).toEqual(value3)
  })

  it("handles trailing slashes", async () => {
    const folder = `/tmp/${randomBytes(32).toString("hex")}/`
    const newPersistence = new FsPersistence(folder)
    await newPersistence.setItem("foo/", toBytes("bar"))
  })
})

function toBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}
