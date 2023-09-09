import { DecodedMessage } from "@xmtp/xmtp-js"
import { and, asc, eq, lt } from "drizzle-orm"
import { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { Json } from "../types.js"
import { bots, conversations, keyValue, messages } from "./schema.js"
import { DB, Message, MessageStatus } from "./types.js"

// Find or create a bot
export async function findOrCreateBot(db: DB, name: string) {
  return db.insert(bots).values({ id: name }).onConflictDoNothing().returning()
}

// Find or create a conversation
export async function findOrCreateConversation(
  db: PostgresJsDatabase,
  peerAddress: string,
  topic: string,
  botName: string,
) {
  return findOne(
    await db
      .insert(conversations)
      .values({ peerAddress, topic, botId: botName })
      .onConflictDoNothing()
      .returning(),
  )
}

// Get the bot and lock for update
export async function getAndLockBot(db: DB, name: string) {
  return findOne(
    await db
      .select()
      .from(bots)
      .for("update")
      .where(eq(bots.id, name))
      .limit(1),
  )
}

// Get the conversation and lock for update
export async function getAndLockConversation(db: DB, conversationId: number) {
  return findOne(
    await db
      .select()
      .from(conversations)
      .for("update")
      .where(eq(conversations.id, conversationId))
      .limit(1),
  )
}

// Update the conversation state
export async function setConversationState(
  db: DB,
  conversationId: number,
  state: Json,
) {
  await db
    .update(conversations)
    .set({ state })
    .where(eq(conversations.id, conversationId))
}

// Update the bot state
export async function setBotState(db: DB, botId: string, state: Json) {
  await db.update(bots).set({ state }).where(eq(bots.id, botId))
}

// Insert a message and return it. If already exists, just return
export async function insertMessage(
  db: DB,
  xmtpMessage: DecodedMessage,
  botId: string,
  conversationId: number,
  status: MessageStatus,
  replyToId: number | null,
) {
  return findOne(
    await db
      .insert(messages)
      .values({
        messageId: xmtpMessage.id,
        contents: Buffer.from(xmtpMessage.toBytes()),
        contentsText: getContentText(xmtpMessage),
        status,
        timestamp: xmtpMessage.sent,
        botId,
        conversationId,
        replyToId,
      })
      .onConflictDoNothing()
      .returning(),
  )
}

// Find the most recent message in a conversation
export async function findMostRecentMessage(
  db: DB,
  topic: string,
): Promise<Message | null> {
  const results = await db
    .select()
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.topic, topic))
    .orderBy(asc(messages.timestamp))
    .limit(1)
  if (results.length === 0) {
    return null
  }
  return results[0].messages
}

// Find and lock any unprocessed messages
export async function findUnprocessedMessages(
  db: DB,
  botId: string,
  maxRetries: number,
) {
  return db
    .select()
    .from(messages)
    .for("update")
    .where(
      and(
        eq(messages.botId, botId),
        eq(messages.status, "unprocessed"),
        lt(messages.numRetries, maxRetries),
      ),
    )
    .orderBy(asc(messages.timestamp))
}

// Set the `status` field for a message
export async function setMessageStatus(
  db: DB,
  messageId: number,
  status: MessageStatus,
) {
  await db.update(messages).set({ status }).where(eq(messages.id, messageId))
}

// Set the `numRetries` field for a message
export async function setMessageNumRetries(
  db: DB,
  messageId: number,
  numRetries: number,
) {
  await db
    .update(messages)
    .set({ numRetries })
    .where(eq(messages.id, messageId))
}

export async function findValue(db: DB, key: string) {
  const results = await db
    .select({
      value: keyValue.value,
    })
    .from(keyValue)
    .where(eq(keyValue.key, key))
    .limit(1)

  if (results.length === 0) {
    return null
  }
  return results[0].value
}

export async function setValue(db: DB, key: string, value: Buffer) {
  await db
    .insert(keyValue)
    .values({ key, value })
    .onConflictDoUpdate({ target: keyValue.key, set: { value } })
}

function findOne<T>(results: T[]): T {
  if (results.length !== 1) {
    throw new Error("Expected one result")
  }
  return results[0]
}

function getContentText(xmtpMessage: DecodedMessage) {
  if (typeof xmtpMessage.content === "string") {
    return xmtpMessage.content
  }
  if (xmtpMessage.contentFallback) {
    return xmtpMessage.contentFallback
  }

  if (
    "toString" in xmtpMessage.content &&
    typeof xmtpMessage.content.toString === "function"
  ) {
    return xmtpMessage.content.toString()
  }

  return ""
}
