import type { BotHandler } from "./bot.js"
import { getEnvOrDefault } from "./utils.js"

const DEFAULT_XMTP_ENV = "dev"
const DEFAULT_MESSAGE_EXPIRY_MS = 1000 * 60 * 30 // 30 minutes

export type BotConfig = {
  xmtpKeys: Uint8Array
  name: string
  xmtpEnv?: "dev" | "production" | "local"
  handler: BotHandler
  messageExpiryMs?: number
}

export function newBotConfig(
  name: string,
  cfg: Omit<BotConfig, "handler" | "name">,
  handler: BotHandler,
): Required<BotConfig> {
  if (!cfg.xmtpKeys) {
    throw new Error("Missing XMTP keys")
  }
  if (!name) {
    throw new Error("Missing bot name")
  }
  return applyBotDefaults({
    ...cfg,
    name,
    handler,
  })
}

export function applyBotDefaults(config: BotConfig): Required<BotConfig> {
  return {
    xmtpEnv: DEFAULT_XMTP_ENV,
    messageExpiryMs: DEFAULT_MESSAGE_EXPIRY_MS,
    ...config,
  }
}

export type AppConfig = {
  db: {
    postgresHost: string
    postgresPort: number
    postgresUser: string
    postgresPassword: string
    postgresDb: string
  }
}

export type PartialAppConfig = {
  db?: Partial<AppConfig["db"]>
}

export type RequiredAppConfig = {
  db: Required<AppConfig["db"]>
}

export function newAppConfig(cfg: PartialAppConfig): RequiredAppConfig {
  return {
    db: {
      postgresHost: getEnvOrDefault(
        "POSTGRES_HOST",
        cfg.db?.postgresHost || "localhost",
      ),
      postgresPort: parseInt(
        getEnvOrDefault(
          "POSTGRES_PORT",
          cfg.db?.postgresPort ? String(cfg.db?.postgresPort) : "4321",
        ),
      ),
      postgresUser: getEnvOrDefault(
        "POSTGRES_USERNAME",
        cfg.db?.postgresUser || "postgres",
      ),
      postgresPassword: getEnvOrDefault(
        "POSTGRES_PASSWORD",
        cfg.db?.postgresPassword || "xmtp",
      ),
      postgresDb: getEnvOrDefault(
        "POSTGRES_DB",
        cfg.db?.postgresDb || "postgres",
      ),
    },
  }
}
