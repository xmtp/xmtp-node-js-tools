import "reflect-metadata"
import { DataSource } from "typeorm"
import { InboundMessage, Reply } from "./models/Message.js"
import { KeyValue } from "./models/KeyValue.js"
import { Conversation } from "./models/Conversation.js"
import { Bot } from "./models/Bot.js"
import { getEnvOrDefault } from "./utils.js"

// Only used for generating and running migrations from the CLI where there is no app config required
// CLI expects a static exported object for a datasource, not a function
export const AppDataSource = new DataSource({
  type: "postgres",
  host: getEnvOrDefault("POSTGRES_HOST", "localhost"),
  port: parseInt(getEnvOrDefault("POSTGRES_PORT", "4321")),
  username: getEnvOrDefault("POSTGRES_USER", "postgres"),
  password: getEnvOrDefault("POSTGRES_PASSWORD", "xmtp"),
  database: getEnvOrDefault("POSTGRES_DB", "postgres"),
  synchronize: false,
  logging: false,
  entities: [Bot, Conversation, InboundMessage, Reply, KeyValue],
  // Jest has a problem with running the migrations, so we just skip them in tests
  // Run ./dev/up to ensure database migrations have been run
  migrations: process.env.TS_JEST ? [] : ["**/migrations/*.ts"],
  subscribers: [],
})
