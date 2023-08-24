import { run, BotConfig, newBotConfig } from "@xmtp/bot-kit-pro"
import echo from "./echo.js"
import waitlist from "./waitlist.js"
import { Wallet } from "ethers"
import { PrivateKeyBundleV1 } from "@xmtp/xmtp-js"
import chatgpt from "./chatgpt.js"
import bodega from "./bodega.js"

const defaultConfig: Partial<BotConfig> = {
  xmtpEnv: "dev",
}

const start = async () => {
  const bots = [
    newBotConfig(
      "echo",
      {
        xmtpKeys: await randomKeys(),
        ...defaultConfig,
      },
      echo,
    ),
    newBotConfig(
      "waitlist",
      {
        xmtpKeys: await randomKeys(),
        ...defaultConfig,
      },
      waitlist,
    ),
    newBotConfig(
      "chatgpt",
      {
        xmtpKeys: await randomKeys(),
        ...defaultConfig,
      },
      chatgpt,
    ),
    newBotConfig(
      "bodega",
      {
        xmtpKeys: await randomKeys(),
        ...defaultConfig,
      },
      bodega,
    ),
  ]
  await run(bots)
}

async function randomKeys() {
  const wallet = Wallet.createRandom()
  const bundle = await PrivateKeyBundleV1.generate(wallet)
  return bundle.encode()
}

start()
