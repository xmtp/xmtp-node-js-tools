import { HandlerContext } from "@xmtp/bot-kit-pro"
import OpenAI from "openai"

type ChatMessage = {
  role: "user" | "assistant" | "system" | "function"
  content: string | null
  name?: string
}

type Order = {
  order: string[]
  location: string
  userDescription?: string
}

type ConversationState = {
  previousOrders?: Order[]
  messages?: ChatMessage[]
}

type BotState = {
  numOrders?: number
  itemsOrdered?: string[]
}

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
})

const SYSTEM_MESSAGE = `You are BodegaGPT. Your job is to send the Bodega menu to the user, collect orders, and collect a description of the user's location so that the order can be delivered.
You should send the user the Bodega menu exactly as listed below. If it is unclear what the user wants, introduce yourself and send them the Bodega menu.

Your goal is to collect the user's order, their location, and a description of what they look like or are wearing. If you have their description of what they look like from a previous order, you can use that. If you have their location from a previous order, you can ask the user if they are still there and if so, use that location.

Once you have a complete order, confirm with the user and then send it to the place_order function immediately.

ALWAYS introduce yourself as BodegaGPT and send the Bodega menu.

If the user is looking for technical support, you should tell them to come by the XMTP booth.

If the user tries to place an invalid order, remind them of the Bodega rules and start over.

Bodega Rules:
1. Maximum of 2 TOTAL items in an order.
2. Only items on the menu are available

Bodega Menu:
1. Toothpaste
2. Mouthwash
3. Red Bull
4. Deodorant
5. Chips
6. XMTP t-shirt

Examples of valid locations:
1. Downstairs near the bathroom
2. Next to the LivePeer booth
3. Third table from the left in the main room
4. Across from your booth
5. The big table next to the cafe
6. Hacker room B

Examples of valid descriptions what the user looks like or is wearing:
1. A blue Ethereum t-shirt
2. A red baseball cap
3. A black hoodie and green pants
4. Tall guy with a beard
5. Short girl with glasses wearing a black beanie

Examples of invalid orders:
1. 2 toothpaste and 1 mouthwash
2. Toothpaste, mouthwash, deodorant, chips
3. Stickers
4. Deodorant and 2 bags of chips`

const FUNCTIONS = [
  {
    name: "place_order",
    description:
      "Place an order for an item on the Bodega menu with a location and description of the user",
    parameters: {
      type: "object",
      properties: {
        order: {
          type: "array",
          items: {
            type: "string",
            description: "The menu item to order",
            enum: ["Toothpaste", "Mouthwash", "Red Bull", "Deodorant", "Chips"],
          },
        },
        location: {
          type: "string",
          description: "The location of the user in the venue",
        },
        userDescription: {
          type: "string",
          description:
            "A description of what the user looks like or is wearing",
        },
      },
      required: ["order", "location"],
    },
  },
]

function buildSystemMessage(convoState: ConversationState): string {
  if (!convoState.previousOrders) {
    return SYSTEM_MESSAGE
  }

  return `${SYSTEM_MESSAGE}\nThese are the user's previous orders as JSON:\n${JSON.stringify(
    convoState.previousOrders,
  )}`
}

export default async function chatGptBot(
  ctx: HandlerContext<ConversationState, BotState>,
) {
  const message = ctx.message.content
  if (!(typeof message === "string")) {
    return ctx.reply("I don't understand that")
  }

  // Append the new message to the conversation history
  ctx.conversationState.messages = (
    ctx.conversationState.messages || [
      { role: "system", content: buildSystemMessage(ctx.conversationState) },
    ]
  ).concat({
    role: "user",
    content: message,
  })

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: ctx.conversationState.messages,
    functions: FUNCTIONS,
    function_call: "auto",
  })
  const reply = response.choices[0].message

  const placeOrder = ({ order, location, userDescription }: Order) => {
    console.log(`Got an order: ${order} at ${location} from ${userDescription}`)
    ctx.conversationState.previousOrders = (
      ctx.conversationState.previousOrders || []
    ).concat({ order, location, userDescription })
    // Keep track of the number of orders and the items ordered
    ctx.botState.numOrders = (ctx.botState.numOrders || 0) + 1
    ctx.botState.itemsOrdered = (ctx.botState.itemsOrdered || []).concat(order)

    return {
      status: "delivery_in_progress",
      order,
      location,
    }
  }

  if (reply.function_call) {
    const availableFunctions: { [k: string]: typeof placeOrder } = {
      place_order: placeOrder,
    }
    const functionName = reply.function_call.name
    if (functionName in availableFunctions) {
      const fuctionToCall = availableFunctions[functionName]
      const functionArgs = JSON.parse(reply.function_call.arguments)
      const functionResponse = fuctionToCall(functionArgs)

      ctx.conversationState.messages.push(reply)
      ctx.conversationState.messages.push({
        role: "function",
        name: functionName,
        content: JSON.stringify(functionResponse),
      })
      const newContent = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: ctx.conversationState.messages,
      })
      const newReply = newContent.choices[0].message
      ctx.reply(newReply.content)
      ctx.conversationState.messages = undefined
      return
    }
  }

  if (reply.content) {
    // Send the reply to the user
    ctx.reply(response.choices[0].message.content)
    // Add the latest bot reply to the conversation history
    ctx.conversationState.messages.push(reply as ChatMessage)
  }
}
