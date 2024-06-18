# Broadcast SDK

## Introduction

User the Broadcast SDK to broadcast to thousands of your subscribers
The Broadcast SDK attempts to take away the need to handle Rate Limiting logic while also allowing integrators information about the broadcast and current statuses

Recommended to use with GRPC client and client caching like the Redis Client

## Installation
```
yarn add @xmtp/broadcast-sdk
```

## Usage
```ts
import { Client } from "@xmtp/xmtp-js"
import { BroadcastClient } from "@xmtp/broadcast-sdk"

// It is highly recommended to use the GRPC client and base a base persistence
import { GrpcApiClient } from "@xmtp/grpc-api-client";
import { RedisPersistence } from "@xmtp/redis-persistence";

const client = await Client.create(wallet, {
  apiClientFactory: GrpcApiClient.fromOptions,
  basePersistence: new RedisPersistence(redis, "xmtp:"),
})

const broadcastClient = new BroadcastClient({
  client,
  addresses: ["0x1234", "0x5678"],
  cachedCanMessageAddresses: ["0x1234"],
})
broadcastClient.broadcast(['Hello!'])
```
