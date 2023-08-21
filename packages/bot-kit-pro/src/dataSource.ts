import "reflect-metadata"
import { DataSource } from "typeorm"
import { InboundMessage, Reply } from "./models/Message.js"
import { KeyValue } from "./models/KeyValue.js"
import { Conversation } from "./models/Conversation.js"
import { Bot } from "./models/Bot.js"
import { RequiredAppConfig } from "./config.js"

export function buildDataSource({ db }: RequiredAppConfig) {
  return new DataSource({
    type: "postgres",
    host: db.postgresHost,
    port: db.postgresPort,
    username: db.postgresUser,
    password: db.postgresPassword,
    database: db.postgresDb,
    synchronize: false,
    logging: false,
    entities: [Bot, Conversation, InboundMessage, Reply, KeyValue],
    // Jest has a problem with running the migrations, so we just skip them in tests
    // Run ./dev/up to ensure database migrations have been run
    migrations: process.env.TS_JEST ? [] : ["**/migrations/*.ts"],
    subscribers: [],
  })
}

export type AppDataSource = ReturnType<typeof buildDataSource>
