import { DecodedMessage } from "@xmtp/xmtp-js"

export default class HandlerContext {
  message: DecodedMessage

  constructor(message: DecodedMessage) {
    this.message = message
  }

  async reply(content: string) {
    await this.message.conversation.send(content)
  }
}
