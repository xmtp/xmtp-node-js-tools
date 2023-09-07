import { existsSync, mkdirSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

import { Repository } from "typeorm"

import { AppDataSource } from "./dataSource.js"
import { KeyValue } from "./models/KeyValue.js"

export class PostgresPersistence {
  repo: Repository<KeyValue>
  constructor(db: AppDataSource) {
    this.repo = db.getRepository(KeyValue)
  }

  async getItem(key: string): Promise<Uint8Array | null> {
    const value = await this.repo.findOneBy({ key })
    if (!value) {
      return null
    }
    const buffer = value.value
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  }

  async setItem(key: string, value: Uint8Array): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .values({
        key,
        value,
      })
      .orUpdate(["value"], ["key"])
      .execute()
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
