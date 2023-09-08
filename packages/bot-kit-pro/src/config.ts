import type { BotHandler } from "./bot.js"
import { getEnvOrDefault } from "./utils.js"

const DEFAULT_XMTP_ENV = "dev"
const DEFAULT_MESSAGE_EXPIRY_MS = 1000 * 60 * 30 // 30 minutes

export type BotConfig = {
  xmtpKeys?: Uint8Array
  name: string
  xmtpEnv?: "dev" | "production" | "local"
  handler: BotHandler
  messageExpiryMs?: number
  skipMessageRefresh?: boolean
}

export type BotCreateConfig = Required<Omit<BotConfig, "xmtpKeys">> & {
  xmtpKeys?: Uint8Array
}

export function newBotConfig(
  name: string,
  cfg: Omit<BotConfig, "handler" | "name">,
  handler: BotHandler,
): BotCreateConfig {
  if (!name) {
    throw new Error("Missing bot name")
  }
  return applyBotDefaults({
    ...cfg,
    name,
    handler,
  })
}

export function applyBotDefaults(config: BotConfig): BotCreateConfig {
  return {
    xmtpEnv: DEFAULT_XMTP_ENV,
    messageExpiryMs: DEFAULT_MESSAGE_EXPIRY_MS,
    skipMessageRefresh: false,
    ...config,
  }
}

type DbConfig = {
  postgresConnectionString: string
}

export type AppConfig = {
  db: DbConfig
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
      postgresConnectionString: getEnvOrDefault(
        "POSTGRES_CONNECTION_STRING",
        cfg.db?.postgresConnectionString ||
          "postgres://postgres:xmtp@localhost:4321/postgres",
      ),
    },
  }
}
