import { DecodedMessage } from "@xmtp/xmtp-js"
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  RelationId,
} from "typeorm"

import { Bot } from "./Bot.js"
import { Conversation } from "./Conversation.js"

export enum MessageStatus {
  Unprocessed = "unprocessed",
  Success = "success",
  Expired = "expired",
  Failed = "failed",
}

@Entity()
@Index(["bot.id", "messageId"], { unique: true })
export class InboundMessage {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  messageId: string

  @Column({ type: "bytea", nullable: false })
  contents: Buffer

  @Column({ default: "unprocessed" })
  status: MessageStatus

  @Column({ type: "timestamptz" })
  timestamp: Date

  @Column({ default: 0 })
  numRetries: number

  @ManyToOne(() => Bot, (bot) => bot.messages)
  bot: Relation<Bot>

  @RelationId((message: InboundMessage) => message.bot) // you need to specify target relation
  botId: string

  @ManyToOne(() => Conversation, (convo) => convo.messages)
  conversation: Relation<Conversation>

  @RelationId((message: InboundMessage) => message.conversation) // you need to specify target relation
  conversationId: number

  @OneToMany(() => Reply, (reply) => reply.replyTo)
  // eslint-disable-next-line no-use-before-define
  replies: Relation<Reply>[]
}

@Entity()
@Index(["bot.id", "messageId"], { unique: true })
export class Reply {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  messageId: string

  @Column({ type: "bytea", nullable: false })
  contents: Buffer

  @Column({ type: "timestamptz" })
  timestamp: Date

  @ManyToOne(() => InboundMessage, (msg) => msg.replies)
  replyTo: Relation<InboundMessage>

  @ManyToOne(() => Bot, (bot) => bot.replies)
  bot: Relation<Bot>

  @ManyToOne(() => Conversation, (convo) => convo.replies)
  conversation: Relation<Conversation>

  static fromXmtpMessage(
    msg: DecodedMessage,
    replyTo: InboundMessage,
    bot: Bot,
    conversation: Conversation,
  ): Partial<Reply> {
    return {
      messageId: msg.id,
      contents: Buffer.from(msg.toBytes()),
      timestamp: msg.sent,
      replyTo,
      bot,
      conversation,
    }
  }
}
