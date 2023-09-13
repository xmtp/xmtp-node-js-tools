import { existsSync, mkdirSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

export class FsPersistence {
  basePath: string
  constructor(basePath: string) {
    this.basePath = basePath
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true })
    }
  }

  async getItem(key: string): Promise<Uint8Array | null> {
    const itemPath = join(this.basePath, sanitizeKey(key))
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
    const fileName = join(this.basePath, sanitizeKey(key))

    await writeFile(fileName, value)
  }
}

function sanitizeKey(key: string): string {
  return key.replace(/\/|\\/g, "-")
}
