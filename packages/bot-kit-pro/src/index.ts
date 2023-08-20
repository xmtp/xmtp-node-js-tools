import "reflect-metadata"
import Bot from "./Bot.js"
import { BotConfig } from "./config.js"
import { AppDataSource } from "./dataSource.js"

export default async function (configs: BotConfig[]) {
  const datasource = await AppDataSource.initialize()
  const bots: Bot[] = []
  for (const botConfig of configs) {
    const bot = await Bot.create(botConfig, datasource)
    bots.push(bot)
    bot.start()
  }

  return {
    stop: async () => {
      for (const bot of bots) {
        await bot.stop()
      }
    },
  }
}
