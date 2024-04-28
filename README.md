![https://github.com/xmtp/bot-kit-pro/actions/workflows/test.yml/badge.svg](https://github.com/xmtp/bot-kit-pro/actions/workflows/test.yml/badge.svg) ![https://github.com/xmtp/bot-kit-pro/actions/workflows/lint.yml/badge.svg](https://github.com/xmtp/bot-kit-pro/actions/workflows/lint.yml/badge.svg) ![Status](https://img.shields.io/badge/Project_status-Alpha-orange)

# XMTP Node.js tools

This repo provides a collection of tools for running high-quality XMTP bots in Node.js. It contains the following packages:

- [Bot Kit](https://github.com/xmtp/botkit): Minimal viable package for creating powerful bots.
- [Bot Kit Pro](./packages/bot-kit-pro/README.md): `Bot Kit Pro` is a framework for running bots on the XMTP network designed for complex workflows that require high reliability.
- [GRPC API Client](./packages/grpc-api-client/README.md): "A GRPC API client for XMTP that facilitates communication between XMTP clients and servers using GRPC protocol.
- [Frames Validator](./packages/frames-validator/README.md): A utility for validating XMTP frames, ensuring data integrity and compliance with the XMTP protocol specifications.
- [Fs Persistence](./packages/gs-persistence/README.md): Provides file system-based data persistence for XMTP clients, enabling data storage and retrieval directly from the file system.
- [Redis Persistence](./packages/redis-persistence/README.md): Implements Redis-based persistence for XMTP clients, supporting efficient data storage and access in a Redis database.
- [CLI Starter](./packages/cli-starter/): It includes a basic setup and examples to get started with building a command-line interface for XMTP.
