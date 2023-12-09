# XMTP Persistence with Redis

## Introduction

This tutorial demonstrates how to use the `RedisPersistence` class from the `@xmtp/redis-persistence` package, part of the `bot-kit-pro` monorepo, to enable XMTP client data persistence in a Redis database.

## Usage

First, install the package in your project:

```bash
yarn add @xmtp/fs-persistence
```

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

## Development

If you want to contribute to this package, here are the steps to set up the project for development:

1. **Test Database Connection**:

```bash
yarn start-redis
```

2. **Run Tests**:

Validate your setup:

```bash
yarn test
```
