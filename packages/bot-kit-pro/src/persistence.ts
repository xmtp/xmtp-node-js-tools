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
