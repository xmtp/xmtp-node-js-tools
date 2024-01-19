# GRPC API Client

![Status](https://img.shields.io/badge/Project_status-Production-green)

An API Client that satisfies the `xmtp-js` `ApiClient` interface, to be used in Node.js applications.

## Features

- Uses GRPC/Protobuf instead of HTTP/JSON for better performance
- Uses the XMTP `Subscribe2` endpoint to allow updating subscriptions without closing the connection
- Configurable logger using `pino`

## Usage

First, install the package in your project:

```bash
yarn add @xmtp/grpc-api-client
```

```ts
import { GrpcApiClient } from "@xmtp/grpc-api-client"
import { Client } from "@xmtp/xmtp-js"

const client = await Client.create(someWallet, {
  apiClientFactory: GrpcApiClient.fromOptions,
})
```

### API Reference

```tsx
subscribe(params: SubscribeParams, callback: SubscribeCallback, onConnectionLost: OnConnectionLostCallback): SubscriptionManager
```

This method is used to subscribe to a stream of new envelopes matching a predicate. It returns a `SubscriptionManager` which provides methods to unsubscribe and update content topics.

```tsx
publish(messages: PublishParams[])`
```

This method is used to publish messages to the network. It takes an array of `PublishParams` as input.

```tsx
query(params: QueryParams, options: QueryAllOptions): Promise<messageApi.Envelope[]>`
```

This method is used to query the store for messages. It returns a promise that resolves to an array of `messageApi.Envelope`.

#### Examples

**Subscribing to a stream**

```ts
let numEnvelopes = 0
const subscriptionManager = apiClient.subscribe(
  { contentTopics: [randomTopic] },
  () => {
    numEnvelopes++
  },
)
```

**Publishing messages**

```ts
await apiClient.publish([buildPublishParams({}), buildPublishParams({})])
```

**Querying for messages**

```ts
const results = await apiClient.query({ contentTopic: randomTopic }, {})
```

Please refer to the test files for more detailed examples and use cases
