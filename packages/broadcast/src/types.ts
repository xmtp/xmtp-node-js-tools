import { type Client } from "@xmtp/xmtp-js"

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
  onBatchStart?: (addresses: string[]) => void
  /**
   * Called when a batch of addresses has been sent/failed
   */
  onBatchComplete?: (addresses: string[]) => void
  /**
   * Called when all addresses have been sent/failed
   */
  onBroadcastComplete?: () => void
  /**
   * Called when an address can't be messaged
   */
  onCantMessageAddress?: (address: string) => void
  /**
   * Called when the list of addresses that can be messaged is updated, this is useful for caching
   */
  onCanMessageAddressesUpdate?: (addresses: string[]) => void
  /**
   * Called when a message is about to be sent
   */
  onMessageSending?: (address: string) => void
  /**
   * Called when a message fails to send
   */
  onMessageFailed?: (address: string) => void
  /**
   * Called when a message is successfully sent
   */
  onMessageSent?: (address: string) => void
  /**
   * Called when a delay is about to happen
   */
  onDelay?: (ms: number) => void
}

export interface BroadcastOptions {
  skipInitialDelay?: boolean
}
