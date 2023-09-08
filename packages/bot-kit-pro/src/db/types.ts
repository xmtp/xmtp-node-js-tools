import { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { bots, conversations, messages } from "./schema"

export type DB = PostgresJsDatabase

export type MessageStatus = (typeof messages.$inferSelect)["status"]

export type Message = typeof messages.$inferSelect

export type Conversation = typeof conversations.$inferSelect

export type Bot = typeof bots.$inferSelect
