# Bot Examples

This repository contains examples of bots built using the `@xmtp/bot-kit-pro` package. Each bot is designed to demonstrate a different feature or use case.

## Bots

### Echo Bot

The Echo bot simply replies with the same message it receives. It's a basic example of a bot that doesn't maintain any state.

```jsx
import { HandlerContext, Json } from "@xmtp/bot-kit-pro"

export default async function (ctx: HandlerContext<Json, Json>) {
  ctx.reply(`You sent: ${ctx.message.content}`)
}
```

## Bodega Bot

The Bodega bot simulates a bodega store. It uses OpenAI to process user messages and can handle orders, keep track of previous orders, and manage a conversation state.

```jsx

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

const SYSTEM_MESSAGE = 'You are BodegaGPT. Your job is to send the Bodega menu to the user, collect orders, and collect a description of the users location so that the order can be delivered. You should send the user the Bodega menu exactly as listed below. If it is unclear what the user wants, introduce yourself and send them the Bodega menu.

Your goal is to collect the users order, their location, and a description of what they look like or are wearing. If you have their description of what they look like from a previous order, you can use that. If you have their location from a previous order, you can ask the user if they are still there and if so, use that location.

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
4. Deodorant and 2 bags of chips'

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

```

## ChatGPT Bot

The ChatGPT bot uses OpenAI's GPT-3 model to generate responses to user messages. It maintains a conversation history and uses it to generate contextually relevant responses.

```jsx
import { HandlerContext, Json } from "@xmtp/bot-kit-pro"
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
```

### Trivia Bot

The Trivia bot hosts a trivia game. It keeps track of user scores and maintains a game state.

```jsx
import { HandlerContext } from "@xmtp/bot-kit-pro"

type TriviaQuestion = {
  q: string
  a: "a" | "b" | "c" | "d"
}

type BotState = {
  scores?: { [k: string]: number }
}

type ConvoState = {
  answers?: TriviaQuestion["a"][]
  hasStartedGame?: boolean
}

const questions: TriviaQuestion[] = [
  {
    q: `Who is often credited with inventing the telephone in the 1870s?

            A. Nikola Tesla
            B. Thomas Edison
            C. Samuel Morse
            D. Alexander Graham Bell`,
    a: "d",
  },
  {
    q: `The first message ever sent over the Morse code telegraph system in 1844 was:

            A. "HELLO WORLD"
            B. "WHAT HATH GOD WROUGHT"
            C. "COME HERE WATSON"
            D. "EUREKA"`,
    a: "b",
  },
  {
    q: `Who is often credited with sending the first electronic mail message in 1971?

        A. Steve Jobs
        B. Bill Gates
        C. Tim Berners-Lee
        D. Ray Tomlinson`,
    a: "d",
  },
  {
    q: `Which early instant messaging system, launched in 1996, became one of the first widespread IM platforms?

        A. Yahoo! Messenger
        B. Google Talk
        C. ICQ
        D. MSN Messenger`,
    a: "c",
  },
  {
    q: `On what date was the first XMTP SDK repo open sourced?

        A. May 12, 2022,
        B. June 7, 2022,
        C. Jan 5, 2022,
        D. Feb 23, 2022`,
    a: "c",
  },
]
```

### Waitlist Bot

The Waitlist bot manages a waitlist. It keeps track of the number of users on the waitlist and can tell a user their position in the waitlist.

```jsx
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
```

### Running the Bots

To run the bots, use the following commands:

- Start the project: `yarn start`

Please note that some bots require environment variables to be set, such as the OpenAI API key for the Bodega and ChatGPT bots.
