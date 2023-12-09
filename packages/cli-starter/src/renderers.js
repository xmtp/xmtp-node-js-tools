import { Box, Spacer, Text } from "ink";
import React, { useEffect, useState } from "react";
import { truncateEthAddress } from "./utils.js";
export const Message = ({ msg: { id, senderAddress, content, sent }, }) => {
    return (React.createElement(Box, { flexDirection: "row", key: id },
        React.createElement(Box, { marginRight: 2 },
            React.createElement(Text, { color: "red" },
                truncateEthAddress(senderAddress),
                ": "),
            React.createElement(Text, null, content)),
        React.createElement(Spacer, null),
        React.createElement(Text, { italic: true, color: "gray" }, sent.toLocaleString())));
};
export const MessageList = ({ messages, title }) => {
    return (React.createElement(Box, { flexDirection: "column", margin: 1 },
        React.createElement(Text, { bold: true }, title),
        React.createElement(Box, { flexDirection: "column", borderStyle: "single" }, messages && messages.length ? (messages.map((message) => React.createElement(Message, { msg: message, key: message.id }))) : (React.createElement(Text, { color: "red", bold: true }, "No messages")))));
};
export const MessageStream = ({ stream, title }) => {
    const [messages, setMessages] = useState([]);
    useEffect(() => {
        if (!stream) {
            return;
        }
        // Keep track of all seen messages.
        // Would be more performant to keep this to a limited buffer of the most recent 5 messages
        const seenMessages = new Set();
        const listenForMessages = async () => {
            for await (const message of stream) {
                if (seenMessages.has(message.id)) {
                    continue;
                }
                // Add the message to the existing array
                setMessages((existing) => existing.concat(message));
                seenMessages.add(message.id);
            }
        };
        listenForMessages();
        // When unmounting, always remember to close the stream
        return () => {
            if (stream) {
                stream.return(undefined);
            }
        };
    }, [stream, setMessages]);
    return React.createElement(MessageList, { title: title, messages: messages });
};
