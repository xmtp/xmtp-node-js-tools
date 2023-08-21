import { DecodedMessage, SendOptions } from "@xmtp/xmtp-js"
import { Json } from "./types.js"

type PreparedReply = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  options?: SendOptions
}

export default class HandlerContext<ConversationState = Json, BotState = Json> {
  message: DecodedMessage
  conversationState: ConversationState
  botState: BotState
  preparedReplies: PreparedReply[]

  constructor(
    message: DecodedMessage,
    conversationState: ConversationState,
    botState: BotState,
  ) {
    this.message = message
    this.conversationState = conversationState
    this.botState = botState
    this.preparedReplies = []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reply(content: any, options?: SendOptions) {
    this.preparedReplies.push({ content, options })
  }
}
