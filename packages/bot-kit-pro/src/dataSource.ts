import "reflect-metadata"
import { DataSource } from "typeorm"
import { InboundMessage, Reply } from "./models/Message.js"
import { Bot } from "./models/Bot.js"
import { Conversation } from "./models/Conversation.js"
import { KeyValue } from "./models/KeyValue.js"

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 6543,
  username: "postgres",
  password: "xmtp",
  database: "postgres",
  synchronize: true,
  logging: false,
  entities: [InboundMessage, Bot, Conversation, Reply, KeyValue],
  migrations: [],
  subscribers: [],
})
