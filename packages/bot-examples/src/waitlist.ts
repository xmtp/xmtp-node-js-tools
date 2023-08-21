import { HandlerContext } from "@xmtp/bot-kit-pro"

type BotState = {
  waitListLength?: number
}

type ConvoState = {
  isOnWaitlist?: boolean
}

/**
 * A simple bot that tracks the number of users on the waitlist
 * The conversations table can later be queried to find all users who are on the waitlist
 */
export default async function waitlist(
  ctx: HandlerContext<ConvoState, BotState>,
) {
  if (ctx.conversationState.isOnWaitlist) {
    return ctx.reply("You're already on the waitlist!")
  }
  ctx.botState.waitListLength = (ctx.botState.waitListLength || 0) + 1

  ctx.conversationState.isOnWaitlist = true
  ctx.reply(
    `You are on the waitlist in position ${ctx.botState.waitListLength}`,
  )
}
