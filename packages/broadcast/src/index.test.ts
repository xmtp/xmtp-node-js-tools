// BroadcastClient.test.js
import { Client, Conversation } from "@xmtp/xmtp-js" // Adjust the import according to your file structure
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BroadcastClient } from "./BroadcastClient" // Adjust the import according to your file structure

describe("BroadcastClient", () => {
  let clientMock: Client
  let conversationMock: Conversation
  let broadcastClient: BroadcastClient

  beforeEach(() => {
    conversationMock = {
      send: vi.fn(),
    } as unknown as Conversation

    clientMock = {
      conversations: {
        list: vi.fn().mockResolvedValue([
          { peerAddress: "address1", send: conversationMock.send },
          { peerAddress: "address2", send: conversationMock.send },
        ]),
        newConversation: vi.fn().mockResolvedValue(conversationMock),
      },
      canMessage: vi.fn().mockResolvedValue([true, true]),
    } as unknown as Client

    broadcastClient = new BroadcastClient({
      client: clientMock,
      addresses: ["address1", "address2"],
      cachedCanMessageAddresses: [],
      rateLimitAmount: 1000,
      rateLimitTime: 1000 * 60 * 5,
    })
  })

  it("should call client.conversations.list and conversation.send", async () => {
    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(clientMock.conversations.list).toHaveBeenCalled()
    expect(conversationMock.send).toHaveBeenCalledTimes(4) // 2 addresses * 2 messages each
  })

  it("should call onBatchStart callback", async () => {
    const onBatchStart = vi.fn()
    broadcastClient.setOnBatchStart(onBatchStart)

    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onBatchStart).toHaveBeenCalledWith(["address1", "address2"])
  })

  it("should call onBatchComplete callback", async () => {
    const onBatchComplete = vi.fn()
    broadcastClient.setOnBatchComplete(onBatchComplete)

    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onBatchComplete).toHaveBeenCalledWith(["address1", "address2"])
  })

  it("should call onBroadcastComplete callback", async () => {
    const onBroadcastComplete = vi.fn()
    broadcastClient.setOnBroadcastComplete(onBroadcastComplete)

    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onBroadcastComplete).toHaveBeenCalled()
  })

  it("should call onCantMessageAddress callback", async () => {
    const onCantMessageAddress = vi.fn()
    broadcastClient.setOnCantMessageAddress(onCantMessageAddress)

    // @ts-expect-error we're mocking the method
    clientMock.canMessage.mockResolvedValue([false, false])

    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onCantMessageAddress).toHaveBeenCalledWith("address1")
    expect(onCantMessageAddress).toHaveBeenCalledWith("address2")
  })

  it("should call onMessageSending and onMessageSent callbacks", async () => {
    const onMessageSending = vi.fn()
    const onMessageSent = vi.fn()
    broadcastClient.setOnMessageSending(onMessageSending)
    broadcastClient.setOnMessageSent(onMessageSent)

    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onMessageSending).toHaveBeenCalledWith("address1")
    expect(onMessageSending).toHaveBeenCalledWith("address2")
    expect(onMessageSent).toHaveBeenCalledWith("address1")
    expect(onMessageSent).toHaveBeenCalledWith("address2")
  })

  it("should call onMessageFailed callback", async () => {
    const onMessageFailed = vi.fn()
    broadcastClient.setRateLimitTime(1)
    broadcastClient.setOnMessageFailed(onMessageFailed)

    // @ts-expect-error we're mocking the method
    conversationMock.send.mockRejectedValue(new Error("Send failed"))

    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onMessageFailed).toHaveBeenCalledWith("address1")
    expect(onMessageFailed).toHaveBeenCalledWith("address2")
  })

  it("should call onCanMessageAddressesUpdate callback", async () => {
    const onCanMessageAddressesUpdate = vi.fn()
    broadcastClient.setOnCanMessageAddressesUpdate(onCanMessageAddressesUpdate)

    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onCanMessageAddressesUpdate).toHaveBeenCalledWith([
      "address1",
      "address2",
    ])
  })

  it("should call onDelay callback", async () => {
    const testRateLimitAmount = 10
    const addresses = Array.from(
      { length: testRateLimitAmount },
      (_, i) => `address${i}`,
    )
    const onDelay = vi.fn()
    broadcastClient.setAddresses(addresses)
    broadcastClient.setOnDelay(onDelay)
    broadcastClient.setRateLimitTime(1)
    broadcastClient.setRateLimitAmount(testRateLimitAmount)

    const messages = ["message1", "message2"]

    await broadcastClient.broadcast(messages, {})

    expect(onDelay).toHaveBeenCalledTimes(4)
  })

  it("should call onWillConversationCreate and use its return value", async () => {
    const onWillConversationCreate = vi
      .fn()
      .mockResolvedValue(["additionalArg1", "additionalArg2"])
    broadcastClient.setOnWillConversationCreate(onWillConversationCreate)
    broadcastClient.setAddresses(["address3"])
    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onWillConversationCreate).toHaveBeenCalledWith("address3")
    expect(clientMock.conversations.newConversation).toHaveBeenCalledWith(
      "address3",
      "additionalArg1",
      "additionalArg2",
    )
  })

  it("should call onWillConversationCreate and work if undefined", async () => {
    broadcastClient.setAddresses(["address3"])
    const messages = ["message1", "message2"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(clientMock.conversations.newConversation).toHaveBeenCalledWith(
      "address3",
    )
  })

  it("should call onMessageSending and use the personalized message if provided", async () => {
    const onMessageSending = vi.fn().mockResolvedValue("personalizedMessage")
    broadcastClient.setOnMessageSending(onMessageSending)

    const messages = ["message1"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onMessageSending).toHaveBeenCalledWith("address1")
    expect(onMessageSending).toHaveBeenCalledWith("address2")
    expect(conversationMock.send).toHaveBeenCalledWith("personalizedMessage")
  })

  it("should use the original message if onMessageSending does not return a personalized message", async () => {
    const onMessageSending = vi.fn().mockResolvedValue(undefined)
    broadcastClient.setOnMessageSending(onMessageSending)

    const messages = ["message1"]
    const options = { skipInitialDelay: true }

    await broadcastClient.broadcast(messages, options)

    expect(onMessageSending).toHaveBeenCalledWith("address1")
    expect(onMessageSending).toHaveBeenCalledWith("address2")
    expect(conversationMock.send).toHaveBeenCalledWith("message1")
  })
})
