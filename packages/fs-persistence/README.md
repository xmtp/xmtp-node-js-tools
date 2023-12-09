# Node FS Persistence

This tutorial will guide you through using the `FsPersistence` class from the `@xmtp/fs-persistence` package to enable XMTP client data persistence using the Node.js file system. This approach is useful for applications where local storage is preferred or required.

## Usage

First, install the package in your project:

```bash
yarn add @xmtp/fs-persistence
```

In your Node.js application, integrate `FsPersistence` with your XMTP client:

```javascript
import { FsPersistence } from "@xmtp/fs-persistence"
import { Client } from "@xmtp/xmtp-js"

// XMTP client setup
const xmtpClient = createXmtpClient({
  // Your XMTP client configuration
  basePersistence: new FsPersistence("/tmp/xmtp"),
})
```

### Development

If you want to contribute to this package, here are the steps to set up the project for development:

Install the necessary packages and build the project:

```bash
yarn install
yarn build
```
