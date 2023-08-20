import {
  Entity,
  OneToMany,
  Repository,
  PrimaryColumn,
  Relation,
  Column,
} from "typeorm"
import { InboundMessage, Reply } from "./Message.js"
import { Conversation } from "./Conversation.js"
import { Json } from "../types.js"

@Entity()
export class Bot {
  @PrimaryColumn()
  id: string

  @Column({ type: "json", default: {} })
  state: Json

  @OneToMany(() => InboundMessage, (message) => message.bot)
  messages: InboundMessage[]

  @OneToMany(() => Reply, (reply) => reply.bot)
  replies: Relation<Reply>[]

  @OneToMany(() => Conversation, (convo) => convo.bot)
  conversations: Relation<Conversation>[]
}

export async function findOrCreateBot(
  repo: Repository<Bot>,
  name: string,
): Promise<Bot> {
  return repo.save({ id: name })
}
