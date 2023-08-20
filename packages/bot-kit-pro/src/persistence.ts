import { Repository } from "typeorm"
import { AppDataSource } from "./dataSource.js"
import { KeyValue } from "./models/KeyValue.js"

export class PostgresPersistence {
  repo: Repository<KeyValue>
  constructor(db: typeof AppDataSource) {
    this.repo = db.getRepository(KeyValue)
  }

  async getItem(key: string): Promise<Uint8Array | null> {
    const value = await this.repo.findOneBy({ key })
    if (!value) {
      return null
    }

    return value.value
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
