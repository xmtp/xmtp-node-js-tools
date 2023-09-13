# Node FS Persistence

A simple implementation of XMTP Persistence interface using the file system

## Usage

```ts
import { FsPersistence } from "@xmtp/fs-persistence"
import { Client } from "@xmtp/xmtp-js"

const client = await Client.create(someWallet, {
  // Specify the base folder to store your files
  basePersistence: new FsPersistence("/tmp/xmtp"),
})
```
