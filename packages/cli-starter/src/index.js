import "./polyfills.js";
import { Client } from "@xmtp/xmtp-js";
import { render, Text } from "ink";
import React from "react";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Message, MessageList, MessageStream } from "./renderers.js";
import { loadWallet, saveRandomWallet, truncateEthAddress, WALLET_FILE_LOCATION, } from "./utils.js";
yargs(hideBin(process.argv))
    .command("init", "Initialize wallet", {}, async (argv) => {
    const { env } = argv;
    saveRandomWallet();
    const client = await Client.create(loadWallet(), {
        env: env,
    });
    render(React.createElement(Text, null,
        "New wallet with address ",
        client.address,
        " saved at ",
        WALLET_FILE_LOCATION));
})
    .command("send <address> <message>", "Send a message to a blockchain address", {
    address: { type: "string", demand: true },
    message: { type: "string", demand: true },
}, async (argv) => {
    const { env, message, address } = argv;
    const client = await Client.create(loadWallet(), {
        env: env,
    });
    const conversation = await client.conversations.newConversation(address);
    const sent = await conversation.send(message);
    render(React.createElement(Message, { msg: sent }));
})
    .command("list-messages <address>", "List all messages from an address", { address: { type: "string", demand: true } }, async (argv) => {
    const { env, address } = argv;
    const client = await Client.create(loadWallet(), {
        env: env,
    });
    const conversation = await client.conversations.newConversation(address);
    const messages = await conversation.messages();
    const title = `Messages between ${truncateEthAddress(client.address)} and ${truncateEthAddress(conversation.peerAddress)}`;
    render(React.createElement(MessageList, { title: title, messages: messages }));
})
    .command("stream-all", "Stream messages coming from any address", {}, async (argv) => {
    const { env } = argv;
    const client = await Client.create(loadWallet(), {
        env: env,
    });
    const stream = await client.conversations.streamAllMessages();
    render(React.createElement(MessageStream, { stream: stream, title: `Streaming all messages` }));
})
    .command("stream <address>", "Stream messages from an address", { address: { type: "string", demand: true } }, async (argv) => {
    const { env, address } = argv; // or message
    const client = await Client.create(loadWallet(), {
        env: env,
    });
    const conversation = await client.conversations.newConversation(address);
    const stream = await conversation.streamMessages();
    render(React.createElement(MessageStream, { stream: stream, title: `Streaming conv messages` }));
})
    .option("env", {
    alias: "e",
    type: "string",
    default: "dev",
    choices: ["dev", "production", "local"],
    description: "The XMTP environment to use",
})
    .demandCommand(1)
    .parse();
