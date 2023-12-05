![https://github.com/xmtp/bot-kit-pro/actions/workflows/test.yml/badge.svg](https://github.com/xmtp/bot-kit-pro/actions/workflows/test.yml/badge.svg) ![https://github.com/xmtp/bot-kit-pro/actions/workflows/lint.yml/badge.svg](https://github.com/xmtp/bot-kit-pro/actions/workflows/lint.yml/badge.svg) ![Status](https://img.shields.io/badge/Project_status-Alpha-orange)

# 🤖 Bot Kit Pro 🤖

Bot Kit Pro is a framework for running bots on the XMTP network designed for complex workflows that require high reliability.

## Features

### 📒 State Storage

Every bot and conversation has a JSON state object that you can write to from inside your bot handler. Keep track of values between messages to build complex conversation workflows.

### 💪 High Reliability

Bot Kit Pro connects to the XMTP network via GRPC for reliable, high performance, message streaming. Every message is stored in a database to ensure that messages are only processed once. If your bot is offline for a period of time it will fill in missing messages to ensure every message gets processed. You can also run multiple instances of your bot in parallel to allow for 0-downtime deploys.

### 🛢️ High Performance Conversation Store

A common complaint from developers using XMTP to build bots is the high cost of running `client.conversations.list()` after restarting your application. We've added a database-backed cache to make sure your application only ever has to decrypt a conversation one time ever.

### 🔎 Designed For Auditability

No more poring over server logs. Because every incoming and outgoing message is stored in a database, you can build admin pages using tools like Retool to view the history of your bot's replies.

### 🧑🏻‍💻 CLI Starter

Starter project for building an XMTP CLI. It provides a basic setup and examples to get started with building a command-line interface for XMTP.

### Bot Starter

This repo makes it easier to create a bot on the XMTP network. It provides a basic setup and examples to get started with bot creation

## Packages

This repo contains the following packages:

- [Bot Kit Pro](./packages/bot-kit-pro/README.md)
- [GRPC API CLient](./packages/grpc-api-client/README.md)
- [Redis Persistence](./packages/redis-persistence/README.md)
- [Bot Examples](./packages/bot-examples/)
- [Bot Starter](./packages/bot-starter/)
- [CLI Starter](./packages/cli-starter/)
