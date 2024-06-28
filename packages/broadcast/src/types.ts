import { type Client } from "@xmtp/xmtp-js"

type Conversations = Client["conversations"]
type CreateConvo = Conversations["newConversation"]
type CreateConversationArgs = Parameters<CreateConvo>
type RemoveFirstFromTuple<T extends unknown[]> = T extends [
  unknown,
  ...infer Rest,
]
  ? Rest
  : []

type AdditionalConversationArgs = RemoveFirstFromTuple<CreateConversationArgs>

export type OnBatchStart = (addresses: string[]) => void

export type OnBatchComplete = (addresses: string[]) => void

export type OnBroadcastComplete = () => void

export type OnCantMessageAddress = (address: string) => void

export type OnCanMessageAddressesUpdate = (addresses: string[]) => void

export type OnMessageSending<ContentTypes = unknown> = (
  address: string,
) => Promise<Exclude<ContentTypes, undefined>>

export type OnMessageFailed = (address: string) => void

export type OnMessageSent = (address: string) => void

export type OnDelay = (ms: number) => void

export type OnWillConversationCreate = (
  address: string,
) => Promise<AdditionalConversationArgs>

export interface BroadcastConstructorParams<ContentTypes = unknown> {
  client: Client<ContentTypes>
  addresses: string[]
  cachedCanMessageAddresses: string[]
  rateLimitAmount?: number
  rateLimitTime?: number

  // Callbacks
  /**
   * Called when a batch of addresses is about to be sent
   */
  onBatchStart?: OnBatchStart
  /**
   * Called when a batch of addresses has been sent/failed
   */
  onBatchComplete?: OnBatchComplete
  /**
   * Called when all addresses have been sent/failed
   */
  onBroadcastComplete?: OnBroadcastComplete
  /**
   * Called when an address can't be messaged
   */
  onCantMessageAddress?: OnCantMessageAddress
  /**
   * Called when the list of addresses that can be messaged is updated, this is useful for caching
   */
  onCanMessageAddressesUpdate?: OnCanMessageAddressesUpdate
  /**
   * Called when a message is about to be sent
   * This can be used to return a different message for each address
   */
  onMessageSending?: OnMessageSending<ContentTypes>
  /**
   * Called when a message fails to send
   */
  onMessageFailed?: OnMessageFailed
  /**
   * Called when a message is successfully sent
   */
  onMessageSent?: OnMessageSent
  /**
   * Called when a delay is about to happen
   */
  onDelay?: OnDelay
  /**
   * Called when a new conversation is about to be created
   * This can be used to add additional payload for individual addresses like conversation context and consent proofs
   */
  onWillConversationCreate?: OnWillConversationCreate
}

export interface BroadcastOptions {
  skipInitialDelay?: boolean
}
