import { type Client } from "@xmtp/xmtp-js"

export interface BroadcastConstructorParams<ContentTypes = unknown> {
  client: Client<ContentTypes>
  addresses: string[]
  cachedCanMessageAddresses: string[]
  rateLimitAmount?: number
  rateLimitTime?: number

  // Callbacks
  onBatchStart?: (addresses: string[]) => void
  onBatchComplete?: (addresses: string[]) => void
  onBroadcastComplete?: () => void
  onCantMessageAddress?: (address: string) => void
  onCanMessageAddreses?: (addresses: string[]) => void
  onMessageSending?: (address: string) => void
  onMessageFailed?: (address: string) => void
  onMessageSent?: (address: string) => void
  onCanMessageAddressesUpdate?: (addresses: string[]) => void
  onDelay?: (ms: number) => void
}

export interface BroadcastOptions {
  skipInitialDelay?: boolean
}
