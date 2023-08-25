import { run, BotConfig, newBotConfig } from "@xmtp/bot-kit-pro"
import echo from "./echo.js"
import waitlist from "./waitlist.js"
import chatgpt from "./chatgpt.js"
import bodega from "./bodega.js"
import trivia from "./trivia.js"

const defaultConfig: Partial<BotConfig> = {
  xmtpEnv: "dev",
}

const start = async () => {
  const bots = [
    newBotConfig("echo", defaultConfig, echo),
    newBotConfig("waitlist", defaultConfig, waitlist),
    newBotConfig("chatgpt", defaultConfig, chatgpt),
    newBotConfig("bodega", defaultConfig, bodega),
    newBotConfig("trivia", defaultConfig, trivia),
  ]
  await run(bots)
}

start()
