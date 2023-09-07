import { BotConfig, newBotConfig, run } from "@xmtp/bot-kit-pro"

import bodega from "./bodega.js"
import chatgpt from "./chatgpt.js"
import echo from "./echo.js"
import trivia from "./trivia.js"
import waitlist from "./waitlist.js"

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
