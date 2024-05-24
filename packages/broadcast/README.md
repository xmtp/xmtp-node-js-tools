# Broadcast SDK

## Installation
```
yarn add @xmtp/broadcast-sdk
```

## Usage
```ts
import { Client } from "@xmtp/xmtp-js"
import { BroadcastClient } from "@xmtp/broadcast-sdk"
// It is highly recommended to use the GRPC client
const client = await Client.create(wallet)

const broadcastClient = new BroadcastClient({
  client,
  addresses: ["0x1234", "0x5678"],
  cachedCanMessageAddresses: ["0x1234"],
})
broadcastClient.broadcast(['Hello!'])
```
