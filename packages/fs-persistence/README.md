# Node FS Persistence

## Introduction

This tutorial will guide you through using the `FsPersistence` class from the `@xmtp/fs-persistence` package to enable XMTP client data persistence using the Node.js file system. This approach is useful for applications where local storage is preferred or required.

## Prerequisites

Ensure you have the following:

1. **Node.js**: The runtime for your application.
2. **Yarn (version 3 or higher)**: Is required when working with this repo. See [Yarn Installation](https://yarnpkg.com/getting-started/install).

   > **Tip**  
   > If you have an earlier version of yarn installed, try running `yarn set version berry` to upgrade to a compatible version.

3. **An XMTP Wallet Instance**: Essential for XMTP client operations.

## Installation

### Clone the Repository

Clone the `bot-kit-pro` repository, which includes the `@xmtp/fs-persistence` package:

```bash
git clone https://github.com/xmtp/bot-kit-pro
cd bot-kit-pro
cd packages
cd fs-persistence
```

### Install Dependencies and Build

Install the necessary packages:

```bash
yarn install
yarn build
```

## Usage

### Step 1: Implement FsPersistence

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
