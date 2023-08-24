import {
  Client,
  NetworkOptions,
  ApiClient,
  LocalAuthenticator,
  PublishParams,
  PrivateKeyBundleV1,
  SortDirection,
  fromNanoString,
  Authenticator,
} from "@xmtp/xmtp-js"
import { Wallet } from "ethers"
import GrpcApiClient from "./GrpcApiClient"
import { randomBytes } from "crypto"

const defaultOptions = (
  opts: Partial<NetworkOptions> = {},
): NetworkOptions => ({
  env: "dev",
  apiUrl: undefined,
  skipContactPublishing: false,
  apiClientFactory: GrpcApiClient.fromOptions,
  ...opts,
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("E2E", () => {
  it("can round trip messages", async () => {
    const clientA = await Client.create(Wallet.createRandom(), {
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    const clientB = await Client.create(Wallet.createRandom(), {
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    const convo = await clientA.conversations.newConversation(clientB.address)
    await convo.send("gm")
    const messages = await convo.messages()
    expect(messages.length).toBe(1)
  })
})

describe("GrpcApiClient", () => {
  let apiClient: ApiClient
  let randomTopic: string

  beforeEach(async () => {
    apiClient = GrpcApiClient.fromOptions(defaultOptions({}))
    apiClient.setAuthenticator(
      new LocalAuthenticator(
        (await PrivateKeyBundleV1.generate(Wallet.createRandom())).identityKey,
      ),
    )
    randomTopic = randomBytes(32).toString("hex")
  })

  const buildPublishParams = (overrides: Partial<PublishParams>) => ({
    timestamp: new Date(),
    message: Uint8Array.from(randomBytes(32)),
    contentTopic: randomTopic,
    ...overrides,
  })

  it("can select the correct env", async () => {
    const devClient = GrpcApiClient.fromOptions(
      defaultOptions({
        env: "dev",
      }),
    )
    expect(devClient.apiUrl).toContain("dev.xmtp.network")

    const prodClient = GrpcApiClient.fromOptions(
      defaultOptions({
        env: "production",
      }),
    )
    expect(prodClient.apiUrl).toContain("production.xmtp.network")

    const localClient = GrpcApiClient.fromOptions(
      defaultOptions({
        env: "local",
      }),
    )
    expect(localClient.apiUrl).toContain("localhost")
  })

  describe("publishing", () => {
    it("can publish", async () => {
      await apiClient.publish([buildPublishParams({}), buildPublishParams({})])
      const results = await apiClient.query({ contentTopic: randomTopic }, {})
      expect(results).toHaveLength(2)
    })

    it("retries auth with new token if auth fails", async () => {
      const realAuthenticator = new LocalAuthenticator(
        (await PrivateKeyBundleV1.generate(Wallet.createRandom())).identityKey,
      )
      let numAttempts = 0

      // Fake authenticator will give a bad token on first attempt and a good token on second
      // The ApiClient should call twice and succeed on the second attempt
      const fakeAuthenticator = {
        createToken: () => {
          numAttempts++
          if (numAttempts === 2) {
            return realAuthenticator.createToken()
          }
          return {
            toBase64: () => "fakeToken",
          }
        },
      }
      apiClient.setAuthenticator(fakeAuthenticator as Authenticator)
      await apiClient.publish([buildPublishParams({})])
      expect(numAttempts).toEqual(2)

      const results = await apiClient.query({ contentTopic: randomTopic }, {})
      expect(results).toHaveLength(1)
    })
  })

  describe("streaming", () => {
    it("can listen to a stream", async () => {
      let numEnvelopes = 0
      const subscriptionManager = apiClient.subscribe(
        { contentTopics: [randomTopic] },
        () => {
          numEnvelopes++
        },
      )
      await sleep(100)
      await apiClient.publish([buildPublishParams({}), buildPublishParams({})])
      await sleep(100)
      expect(numEnvelopes).toBe(2)
      await subscriptionManager.unsubscribe()
    })

    it("can abort a stream", async () => {
      let numEnvelopes = 0
      const subscriptionManager = apiClient.subscribe(
        { contentTopics: [randomTopic] },
        () => {
          numEnvelopes++
        },
      )
      await sleep(100)
      await apiClient.publish([buildPublishParams({})])
      await sleep(100)
      await subscriptionManager.unsubscribe()
      await apiClient.publish([buildPublishParams({})])
      await sleep(100)
      expect(numEnvelopes).toBe(1)
    })
  })

  describe("query", () => {
    it("can handle empty results", async () => {
      const result = await apiClient.query(
        {
          contentTopic: randomTopic,
        },
        {},
      )
      expect(result).toEqual([])
    })

    it("can query by date range", async () => {
      const message1Date = new Date(new Date().getTime() - 50)
      const message2Date = new Date()

      await apiClient.publish([
        buildPublishParams({
          message: Uint8Array.from([1, 2, 3]),
          timestamp: message1Date,
        }),
        buildPublishParams({
          message: Uint8Array.from([2, 3, 4]),
          timestamp: message2Date,
        }),
      ])

      const queryAroundMessage1 = await apiClient.query(
        {
          contentTopic: randomTopic,
          startTime: new Date(message1Date.getTime() - 1),
          endTime: new Date(message1Date.getTime() + 1),
        },
        {},
      )
      expect(queryAroundMessage1).toHaveLength(1)
      expect(queryAroundMessage1[0].message).toEqual(Uint8Array.from([1, 2, 3]))
    })

    it("can limit results", async () => {
      const envelopes = Array.from({ length: 10 }, (_, i) =>
        buildPublishParams({ message: Uint8Array.from([i]) }),
      )
      await apiClient.publish(envelopes)
      await sleep(100)

      const baseQuery = { contentTopic: randomTopic }
      const withLimit5 = await apiClient.query(baseQuery, { limit: 5 })
      expect(withLimit5).toHaveLength(5)

      const withLimit10 = await apiClient.query(baseQuery, { limit: 10 })
      expect(withLimit10).toHaveLength(10)
    })

    it("can sort results", async () => {
      const envelopes = Array.from({ length: 10 }, (_, i) =>
        buildPublishParams({ timestamp: new Date(Date.now() + i) }),
      )
      await apiClient.publish(envelopes)

      const baseQuery = { contentTopic: randomTopic }
      const ascending = await apiClient.query(baseQuery, {
        direction: SortDirection.SORT_DIRECTION_ASCENDING,
      })
      ascending.reduce((memo, curr) => {
        if (!memo) {
          return curr
        }
        expect(fromNanoString(curr.timestampNs)?.getTime()).toBeGreaterThan(
          fromNanoString(memo.timestampNs as unknown as string)!.getTime(),
        )

        return curr
      })

      const descending = await apiClient.query(baseQuery, {
        direction: SortDirection.SORT_DIRECTION_DESCENDING,
      })
      descending.reduce((memo, curr) => {
        if (!memo) {
          return curr
        }
        expect(fromNanoString(curr.timestampNs)?.getTime()).toBeLessThan(
          fromNanoString(memo.timestampNs as unknown as string)!.getTime(),
        )

        return curr
      })
    })
  })
})
