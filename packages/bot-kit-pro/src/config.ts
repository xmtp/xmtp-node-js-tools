import type { BotHandler } from "./Bot.js"

export type BotConfig = {
  xmtpKeys: Uint8Array
  name: string
  xmtpEnv?: "dev" | "production" | "local"
  handler: BotHandler
  messageExpiryMs?: number
}

export function newBotConfig(
  cfg: Omit<BotConfig, "handler">,
  handler: BotHandler,
): BotConfig {
  if (!cfg.xmtpKeys) {
    throw new Error("Missing XMTP keys")
  }
  if (!cfg.name) {
    throw new Error("Missing bot name")
  }
  return {
    ...cfg,
    handler,
  }
}
