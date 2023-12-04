# GRPC API Client

![Status](https://img.shields.io/badge/Project_status-Alpha-orange)

An API Client that satisfies the `xmtp-js` `ApiClient` interface, to be used in Node.js applications.

The GRPC API Client is _not yet ready to be used in production applications_

## Features

- Uses GRPC/Protobuf instead of HTTP/JSON for better performance
- Uses the XMTP `Subscribe2` endpoint to allow updating subscriptions without closing the connection
- Configurable logger using `pino`

## Usage

```ts
import { GrpcApiClient } from "@xmtp/grpc-api-client"
import { Client } from "@xmtp/xmtp-js"

const client = await Client.create(someWallet, {
  apiClientFactory: GrpcApiClient.fromOptions,
})
```
