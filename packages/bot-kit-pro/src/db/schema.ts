import { relations } from "drizzle-orm"
import {
  customType,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"

import { Json } from "../types"

const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "bytea"
  },
})

export const bots = pgTable("bots", {
  id: text("id").primaryKey(),
  state: json("state").default({}).$type<Json>().notNull(),
})

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    peerAddress: text("peer_address").notNull(),
    topic: text("topic").notNull(),
    botId: text("bot_id")
      .references(() => bots.id)
      .notNull(),
    state: json("state").default({}).$type<Json>().notNull(),
  },
  (t) => ({
    unq: unique().on(t.botId, t.topic),
  }),
)

export const keyValue = pgTable("key_value", {
  key: text("key").primaryKey(),
  value: bytea("value").notNull(),
})

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    messageId: text("message_id").notNull(),
    contents: bytea("contents").notNull(),
    status: text("status", {
      enum: ["unprocessed", "processed", "expired", "error", "reply"],
    })
      .default("unprocessed")
      .notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    numRetries: integer("num_retries").default(0).notNull(),
    botId: text("bot_id")
      .references(() => bots.id)
      .notNull(),
    conversationId: integer("conversation_id")
      .references(() => conversations.id)
      .notNull(),
    replyToId: integer("reply_to_id"),
  },
  (t) => ({
    botMsg: unique().on(t.botId, t.messageId),
  }),
)

export const botsRelations = relations(bots, ({ many }) => ({
  conversations: many(conversations),
  messages: many(messages),
}))

export const conversationsRelations = relations(conversations, ({ one }) => ({
  bot: one(bots, {
    fields: [conversations.botId],
    references: [bots.id],
  }),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  bot: one(bots, {
    fields: [messages.botId],
    references: [bots.id],
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}))
