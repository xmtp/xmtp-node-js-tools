import Bot from "./bot.js"
import { BotCreateConfig, newAppConfig, PartialAppConfig } from "./config.js"
import { buildDrizzle, doMigrations } from "./db/database.js"

export default async function (
  botConfigs: BotCreateConfig[],
  appConfig: PartialAppConfig = {},
) {
  const appliedAppConfig = newAppConfig(appConfig)
  await doMigrations(appliedAppConfig.db)
  const { db, connection } = await buildDrizzle(appliedAppConfig.db)

  const bots: Bot[] = []
  for (const botConfig of botConfigs) {
    const bot = await Bot.create(botConfig, db)
    bots.push(bot)
    bot.start()
  }

  return {
    bots,
    stop: async () => {
      for (const bot of bots) {
        await bot.stop()
      }
      await connection.end()
    },
  }
}
