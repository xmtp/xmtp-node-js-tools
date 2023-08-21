import { Json, HandlerContext } from "@xmtp/bot-kit-pro"
import OpenAI from "openai"

type ChatMessage = {
  role: "user" | "assistant" | "system" | "function"
  content: string
}

type ConversationState = {
  messages?: ChatMessage[]
}

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
})

export default async function chatGptBot(
  ctx: HandlerContext<ConversationState, Json>,
) {
  const message = ctx.message.content
  if (!(typeof message === "string")) {
    return ctx.reply("I don't understand that")
  }

  // Append the new message to the conversation history
  ctx.conversationState.messages = (
    ctx.conversationState.messages || []
  ).concat({
    role: "user",
    content: message,
  })

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: ctx.conversationState.messages,
  })
  const reply = response.choices[0].message

  if (reply.content) {
    // Send the reply to the user
    ctx.reply(response.choices[0].message.content)
    // Add the latest bot reply to the conversation history
    ctx.conversationState.messages.push(reply as ChatMessage)
  }
}
