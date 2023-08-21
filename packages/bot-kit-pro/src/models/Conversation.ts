import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  Index,
  Repository,
  Relation,
} from "typeorm"
import { InboundMessage, Reply } from "./Message.js"
import { Bot } from "./Bot.js"
import { Json } from "../types.js"
@Entity()
@Index(["bot.id", "topic"], { unique: true })
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  peerAddress: string

  @Column()
  topic: string

  @ManyToOne(() => Bot, (bot) => bot.conversations)
  bot: Relation<Bot>

  @Column({ type: "json", default: {} })
  state: Json

  @OneToMany(() => InboundMessage, (message) => message.conversation)
  messages: Relation<InboundMessage>[]

  @OneToMany(() => Reply, (reply) => reply.conversation)
  replies: Relation<Reply>[]
}

export async function findOrCreateConversation(
  repo: Repository<Conversation>,
  peerAddress: string,
  topic: string,
  botName: string,
): Promise<Conversation> {
  const existing = await repo.findOneBy({ topic, bot: { id: botName } })
  if (existing) {
    return existing
  }

  return repo.save(repo.create({ peerAddress, topic, bot: { id: botName } }))
}
