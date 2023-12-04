# XMTP Persistence with Redis

## Introduction

This tutorial demonstrates how to use the `RedisPersistence` class from the `@xmtp/redis-persistence` package, part of the `bot-kit-pro` monorepo, to enable XMTP client data persistence in a Redis database.

## Prerequisites

Before starting, make sure you have:

1. **A Running Redis Instance**: Redis installed and operational.
2. **An XMTP Wallet Instance**: Required for XMTP client operations.
3. **Yarn (version 3 or higher)**: Is required when working with this repo. See [Yarn Installation](https://yarnpkg.com/getting-started/install).

   > **Tip**  
   > If you have an earlier version of yarn installed, try running `yarn set version berry` to upgrade to a compatible version.

4. **Docker**: Optional, for containerizing Redis or your application.
5. **Node.js**: The runtime for your application.

## Installation

### Clone the Repository

Clone the `bot-kit-pro` repository from GitHub:

```bash
git clone https://github.com/xmtp/bot-kit-pro
cd bot-kit-pro
cd packages
cd redis-persistance
```

### Install Dependencies and Build

Install the necessary packages and build the project:

```bash
yarn install
yarn build
```

## Additional Setup

1. **Test Database Connection**:

   ```bash
   yarn start-redis
   ```

2. **Run Tests**:

   Validate your setup:

   ```bash
   yarn test
   ```

## Usage

### Step 1: Create a Redis Client

Connect to your Redis instance:

```javascript
const { createClient } = require("redis")
const redis = createClient({
  url: "redis://localhost:6379",
})
client.connect()
```

### Step 2: Implement RedisPersistence

Integrate `RedisPersistence` with your XMTP client:

```javascript
const { RedisPersistence } = require("@xmtp/redis-persistence")
const { createClient: createXmtpClient } = require("@xmtp/xmtp-js")

// XMTP client setup
const xmtpClient = createXmtpClient({
  // Your XMTP client configuration
  basePersistence: new RedisPersistence(redis, "xmtp:"),
})
```

### Run Demo

```jsx
node main.js
```
