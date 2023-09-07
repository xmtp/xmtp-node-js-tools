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

export default async function trivia({
  botState,
  conversationState,
  message,
  reply,
}: HandlerContext<ConvoState, BotState>) {
  conversationState.answers = conversationState.answers || []

  if (!conversationState.hasStartedGame) {
    reply(`Let's play some messaging trivia!`)
  }

  if (botState.scores && botState.scores[message.senderAddress]) {
    const highScoreText = getHighScoreText(botState)

    return reply(
      `Your score is ${
        botState.scores[message.senderAddress]
      }.${highScoreText} Thanks for playing`,
    )
  }

  const messageText = (message.content || "").trim().toLowerCase()

  if (["a", "b", "c", "d"].includes(messageText)) {
    conversationState.answers.push(messageText as TriviaQuestion["a"])
    const isCorrect =
      messageText === questions[conversationState.answers.length - 1].a
    reply(`Your answer is ${isCorrect ? "correct!" : "incorrect"}`)
  } else if (
    conversationState.hasStartedGame &&
    conversationState.answers.length < questions.length
  ) {
    return reply("Invalid entry. Please answer with a letter between A and D")
  }

  if (conversationState.answers.length < questions.length) {
    const question = questions[conversationState.answers.length]
    conversationState.hasStartedGame = true
    reply(question.q)
  }

  if (conversationState.answers.length === questions.length) {
    const score = conversationState.answers.reduce((acc, answer, i) => {
      return acc + (answer === questions[i].a ? 1 : 0)
    }, 0)
    botState.scores = botState.scores || {}
    botState.scores[message.senderAddress] = score
    reply(
      `You scored ${score} out of ${questions.length}!.${getHighScoreText(
        botState,
      )}`,
    )
  }
}

function getHighScore(botState: BotState): [string, number] | null {
  const scores = botState.scores || {}
  const entries = Object.entries(scores)
  if (!entries.length) {
    return null
  }

  return entries.reduce((acc, entry) => {
    return entry[1] > acc[1] ? entry : acc
  }, entries[0])
}

function getHighScoreText(botState: BotState) {
  const highScore = getHighScore(botState)
  return highScore
    ? ` The high score is ${highScore[1]} by ${highScore[0]}.`
    : ""
}
