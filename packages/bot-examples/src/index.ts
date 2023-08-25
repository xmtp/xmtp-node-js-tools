import { run, BotConfig, newBotConfig } from "@xmtp/bot-kit-pro"
import echo from "./echo.js"
import waitlist from "./waitlist.js"
import chatgpt from "./chatgpt.js"
import bodega from "./bodega.js"
import trivia from "./trivia.js"
import { getKeys } from "./utils.js"

const defaultConfig: Partial<BotConfig> = {
  xmtpEnv: "dev",
}

const start = async () => {
  const bots = [
    newBotConfig(
      "echo",
      {
        xmtpKeys: await getKeys("echo"),
        ...defaultConfig,
      },
      echo,
    ),
    newBotConfig(
      "waitlist",
      {
        xmtpKeys: await getKeys("waitlist"),
        ...defaultConfig,
      },
      waitlist,
    ),
    newBotConfig(
      "chatgpt",
      {
        xmtpKeys: await getKeys("chatgpt"),
        ...defaultConfig,
      },
      chatgpt,
    ),
    newBotConfig(
      "bodega",
      {
        xmtpKeys: await getKeys("bodega"),
        ...defaultConfig,
      },
      bodega,
    ),
    newBotConfig(
      "trivia",
      {
        xmtpKeys: await getKeys("trivia"),
        ...defaultConfig,
      },
      trivia,
    ),
  ]
  await run(bots)
}

start()
