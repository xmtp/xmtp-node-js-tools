import "reflect-metadata"
import Bot from "./bot.js"
import { PartialAppConfig, BotConfig, newAppConfig } from "./config.js"
import { buildDataSource } from "./dataSource.js"

export default async function (
  botConfigs: Required<BotConfig>[],
  appConfig: PartialAppConfig = {},
) {
  const appDataSource = buildDataSource(newAppConfig(appConfig))
  const datasource = await appDataSource.initialize()
  await datasource.runMigrations()

  const bots: Bot[] = []
  for (const botConfig of botConfigs) {
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
