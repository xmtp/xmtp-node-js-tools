import { HandlerContext, Json } from "@xmtp/bot-kit-pro"

export default async function (ctx: HandlerContext<Json, Json>) {
  ctx.reply(`You sent: ${ctx.message.content}`)
}
