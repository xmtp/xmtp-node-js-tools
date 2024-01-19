![https://github.com/xmtp/bot-kit-pro/actions/workflows/test.yml/badge.svg](https://github.com/xmtp/bot-kit-pro/actions/workflows/test.yml/badge.svg) ![https://github.com/xmtp/bot-kit-pro/actions/workflows/lint.yml/badge.svg](https://github.com/xmtp/bot-kit-pro/actions/workflows/lint.yml/badge.svg) ![Status](https://img.shields.io/badge/Project_status-Alpha-orange)

# XMTP Node.js tools

This repo provides a collection of tools for running high-quality XMTP bots in Node.js. It contains the following packages:

- [Bot Kit Pro](./packages/bot-kit-pro/README.md)
- [GRPC API Client](./packages/grpc-api-client/README.md)
- [Redis Persistence](./packages/redis-persistence/README.md)
- [Bot Examples](./packages/bot-examples/)
- [Bot Starter](./packages/bot-starter/)
- [CLI Starter](./packages/cli-starter/)

## Bot Kit Pro

Bot Kit Pro is a framework for running bots on the XMTP network designed for complex workflows that require high reliability.

### 📒 State Storage

Every bot and conversation has a JSON state object you can write to from inside your bot handler. Keep track of values between messages to build complex conversation workflows.

### 💪 High reliability

Bot Kit Pro connects to the XMTP network via GRPC for reliable, high-performance message streaming. Every message is stored in a database to ensure that messages are processed only once. If your bot is offline for some time, it will fill in missing messages to ensure every message gets processed. You can also run multiple instances of your bot in parallel to allow for zero-downtime deploys.

### 🛢️ High-performance conversation store

A common complaint from developers using XMTP to build bots is the high cost of running `client.conversations.list()` after restarting their apps. We added a database-backed cache so that apps need to decrypt a conversation only once.

### 🔎 Designed For auditability

No more poring over server logs. Because every incoming and outgoing message is stored in a database, you can build admin pages using tools like Retool to view the history of your bot's replies.

### 🧑🏻‍💻 CLI Starter

This package provides a starter project for building an XMTP CLI. It includes a basic setup and examples to get started with building a command-line interface for XMTP.

### Bot Starter

This package makes it easier to create a bot on the XMTP network. It provides a basic setup and examples to get started with bot creation.
