import { existsSync, mkdirSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

import { DB, findValue, setValue } from "./db/index.js"

export class PostgresPersistence {
  db: DB
  constructor(db: DB) {
    this.db = db
  }

  async getItem(key: string): Promise<Uint8Array | null> {
    const value = await findValue(this.db, key)
    if (!value) {
      return null
    }
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  }

  async setItem(key: string, value: Uint8Array): Promise<void> {
    await setValue(this.db, key, Buffer.from(value))
  }
}

export class FsPersistence {
  basePath: string
  constructor(basePath: string) {
    this.basePath = basePath
  }

  async getItem(key: string): Promise<Uint8Array | null> {
    const itemPath = join(this.basePath, key)
    try {
      const data = await readFile(itemPath)
      return new Uint8Array(data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if ("code" in e && e.code === "ENOENT") {
        return null
      }
      throw e
    }
  }

  async setItem(key: string, value: Uint8Array): Promise<void> {
    const fileName = join(this.basePath, key)
    const directory = dirname(fileName)
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true })
    }
    await writeFile(fileName, value)
  }
}
