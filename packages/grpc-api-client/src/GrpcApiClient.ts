import { credentials } from "@grpc/grpc-js"
import { GrpcTransport } from "@protobuf-ts/grpc-transport"
import { DuplexStreamingCall, RpcError } from "@protobuf-ts/runtime-rpc"
import { messageApi } from "@xmtp/proto"
import {
  ApiClient,
  AuthCache,
  Authenticator,
  NetworkOptions,
  OnConnectionLostCallback,
  PublishParams,
  Query,
  QueryAllOptions,
  QueryParams,
  QueryStreamOptions,
  retry,
  SubscribeCallback,
  SubscribeParams,
  SubscriptionManager,
} from "@xmtp/xmtp-js"
import pino from "pino"

import { MessageApiClient } from "./gen/message_api/v1/message_api.client.js"
import {
  BatchQueryRequest,
  BatchQueryResponse,
  Cursor,
  Envelope,
  PagingInfo,
  PublishRequest,
  PublishResponse,
  QueryRequest,
  QueryResponse,
  SortDirection,
  SubscribeRequest,
} from "./gen/message_api/v1/message_api.js"

const API_URLS: { [k: string]: string } = {
  dev: "grpc.dev.xmtp.network:443",
  production: "grpc.production.xmtp.network:443",
  local: "localhost:5556",
}

const SLEEP_TIME = 1000
const MAX_RETRIES = 4

const clientOptions = {
  "grpc.keepalive_timeout_ms": 1000 * 10, // 10 seconds
  "grpc.keepalive_time_ms": 1000 * 30, // 30 seconds
  "grpc.enable_retries": 1,
  "grpc.keepalive_permit_without_calls": 0,
} as const

export default class GrpcApiClient implements ApiClient {
  grpcClient: MessageApiClient
  private authCache?: AuthCache
  private appVersion?: string
  private logger: pino.Logger
  apiUrl: string

  constructor(apiUrl: string, isSecure: boolean, appVersion?: string) {
    this.apiUrl = apiUrl
    this.appVersion = appVersion
    this.logger = pino({ name: "GrpcApiClient" })
    this.grpcClient = new MessageApiClient(
      new GrpcTransport({
        host: apiUrl,
        clientOptions,
        channelCredentials: isSecure
          ? credentials.createSsl()
          : credentials.createInsecure(),
      }),
    )
  }

  static fromOptions(options: NetworkOptions): GrpcApiClient {
    const apiUrl = options.apiUrl || API_URLS[options.env]
    if (!apiUrl) {
      throw new Error("Could not find API URL from options")
    }
    const isSecure = !apiUrl.includes("localhost")
    return new GrpcApiClient(apiUrl, isSecure, options.appVersion)
  }

  private async _publish(
    req: PublishRequest,
    attemptNumber = 0,
  ): Promise<PublishResponse> {
    const token = await this.getToken()
    try {
      return (
        await retry(
          this.grpcClient.publish.bind(this.grpcClient),
          [
            req,
            {
              meta: { ...this.metadata(), authorization: `Bearer ${token}` },
            },
          ],
          MAX_RETRIES,
          SLEEP_TIME,
          isNotAuthError,
        )
      ).response
    } catch (e) {
      if (isNotAuthError(e as Error) || attemptNumber >= 1) {
        throw e
      }
      await this.authCache?.refresh()
      return this._publish(req, attemptNumber + 1)
    }
  }

  private _query(req: QueryRequest): Promise<QueryResponse> {
    return retry(
      this.grpcClient.query.bind(this.grpcClient),
      [req, { meta: this.metadata() }],
      MAX_RETRIES,
      SLEEP_TIME,
    ).then((res) => res.response)
  }

  private _batchQuery(req: BatchQueryRequest): Promise<BatchQueryResponse> {
    return retry(
      this.grpcClient.batchQuery.bind(this.grpcClient),
      [req, { meta: this.metadata() }],
      MAX_RETRIES,
      SLEEP_TIME,
    ).then((res) => res.response)
  }

  async query(
    params: QueryParams,
    {
      direction = messageApi.SortDirection.SORT_DIRECTION_ASCENDING,
      limit,
    }: QueryAllOptions,
  ): Promise<messageApi.Envelope[]> {
    const out: messageApi.Envelope[] = []
    // Use queryIteratePages for better performance. 1/100th the number of Promises to resolve compared to queryStream
    for await (const page of this.queryIteratePages(params, {
      direction,
      // If there is a limit of < 100, use that as the page size. Otherwise use 100 and stop if/when limit reached.
      pageSize: limit && limit < 100 ? limit : 100,
    })) {
      for (const envelope of page) {
        out.push(envelope)
        if (limit && out.length === limit) {
          return out
        }
      }
    }
    return out
  }

  async *queryIterator(
    params: QueryParams,
    options: QueryStreamOptions,
  ): AsyncGenerator<messageApi.Envelope> {
    for await (const page of this.queryIteratePages(params, options)) {
      for (const envelope of page) {
        yield envelope
      }
    }
  }

  async *queryIteratePages(
    { contentTopic, startTime, endTime }: QueryParams,
    { direction, pageSize = 100 }: QueryStreamOptions,
  ): AsyncGenerator<messageApi.Envelope[]> {
    if (!contentTopic || !contentTopic.length) {
      throw new Error("Must specify content topics")
    }

    const startTimeNs = startTime ? toNanos(startTime) : BigInt(0)
    const endTimeNs = endTime ? toNanos(endTime) : BigInt(0)
    let cursor: Cursor | undefined

    while (true) {
      const pagingInfo: PagingInfo = {
        limit: pageSize,
        direction: getSortDirection(direction),
        cursor,
      }

      const result = await this._query({
        contentTopics: [contentTopic],
        startTimeNs,
        endTimeNs,
        pagingInfo,
      })

      if (result.envelopes?.length) {
        yield result.envelopes.map(toHttpEnvelope)
      } else {
        return
      }

      if (result.pagingInfo?.cursor) {
        cursor = result.pagingInfo?.cursor
      } else {
        return
      }
    }
  }

  publish(messages: PublishParams[]) {
    const envelopes = messages.map((params) => {
      const { contentTopic, message, timestamp } = params
      return {
        contentTopic,
        message,
        timestampNs: toNanos(timestamp || new Date()),
      }
    })
    return this._publish({ envelopes })
  }

  subscribe(
    params: SubscribeParams,
    callback: SubscribeCallback,
    onConnectionLost: OnConnectionLostCallback,
  ): SubscriptionManager {
    const { contentTopics } = params
    const req = {
      contentTopics,
    }
    const abortController = new AbortController()
    let stream: DuplexStreamingCall<SubscribeRequest, Envelope>
    const doSubscribe = async () => {
      while (true) {
        const startTime = new Date()
        try {
          stream = this.grpcClient.subscribe2({
            abort: abortController.signal,
          })

          await stream.requests.send(req)
          stream.responses.onMessage((msg) => callback(toHttpEnvelope(msg)))
          stream.responses.onError((err) => {
            this.logger.error({ error: err }, "stream error")
            onConnectionLost?.(err)
          })
          await stream
        } catch (e) {
          if (isAbortError(e as RpcError)) {
            this.logger.debug({ contentTopics }, "aborting stream")
            return
          }
          if (new Date().getTime() - startTime.getTime() < 1000) {
            await sleep(1000)
          }
          onConnectionLost?.(e)
          this.logger.error({ error: e }, "stream error")
        }
      }
    }

    doSubscribe()

    return {
      unsubscribe: async () => {
        this.logger.debug("unsubscribing")
        abortController.abort()
        await stream.requests.complete()
      },
      updateContentTopics: async (topics: string[]) => {
        if (topics.length && !abortController.signal.aborted && stream) {
          this.logger.debug("updating content topics")
          await stream.requests.send({ contentTopics: topics })
        }
      },
    }
  }

  async batchQuery(queries: Query[]): Promise<messageApi.Envelope[][]> {
    // Group queries into batches of 50 (implicit server-side limit) and then perform BatchQueries
    const BATCH_SIZE = 50
    // Keep a list of BatchQueryRequests to execute all at once later
    const batchRequests: BatchQueryRequest[] = []

    // Assemble batches
    for (let i = 0; i < queries.length; i += BATCH_SIZE) {
      const queriesInBatch = queries.slice(i, i + BATCH_SIZE)
      // Perform batch query by first compiling a list of repeated individual QueryRequests
      // then populating a BatchQueryRequest with that list
      const constructedQueries: QueryRequest[] = []

      for (const queryParams of queriesInBatch) {
        constructedQueries.push({
          contentTopics: [queryParams.contentTopic],
          startTimeNs: queryParams.startTime
            ? toNanos(queryParams.startTime)
            : BigInt(0),
          endTimeNs: queryParams.endTime
            ? toNanos(queryParams.endTime)
            : BigInt(0),
          pagingInfo: {
            limit: queryParams.pageSize || 10,
            direction: getSortDirection(queryParams.direction),
          },
        })
      }
      const batchQueryRequest = {
        requests: constructedQueries,
      }
      batchRequests.push(batchQueryRequest)
    }

    // Execute batches
    const batchQueryResponses = await Promise.all(
      batchRequests.map(async (batch) => this._batchQuery(batch)),
    )

    // For every batch, read all responses within the batch, and add to a list of lists of envelopes
    // one top-level list for every original query
    const allEnvelopes: messageApi.Envelope[][] = []
    for (const batchResponse of batchQueryResponses) {
      if (!batchResponse.responses) {
        // An error on any of the batch query is propagated to the caller
        // for simplicity, rather than trying to return partial results
        throw new Error("BatchQueryResponse missing responses")
      }
      for (const queryResponse of batchResponse.responses) {
        if (queryResponse.envelopes) {
          allEnvelopes.push(queryResponse.envelopes.map(toHttpEnvelope))
        } else {
          // If no envelopes provided, then add an empty list
          allEnvelopes.push([])
        }
      }
    }
    return allEnvelopes
  }

  setAuthenticator(
    authenticator: Authenticator,
    cacheExpirySeconds?: number,
  ): void {
    this.authCache = new AuthCache(authenticator, cacheExpirySeconds)
  }

  setLogger(logger: pino.Logger): void {
    this.logger = logger.child({ module: "GrpcApiClient" })
  }

  private getToken(): Promise<string> {
    if (!this.authCache) {
      throw new Error("AuthCache is not set on API Client")
    }
    return this.authCache.getToken()
  }

  private metadata(): { [k: string]: string } {
    return this.appVersion ? { "x-app-version": this.appVersion } : {}
  }
}

function toNanos(timestamp: Date) {
  const asBigInt = BigInt(timestamp.getTime()) * BigInt(1_000_000)
  return asBigInt
}

function toHttpEnvelope(env: Envelope): messageApi.Envelope {
  return {
    contentTopic: env.contentTopic,
    message: Uint8Array.from(env.message),
    timestampNs: toNanoString(env.timestampNs),
  }
}

function toNanoString(d: bigint): undefined | string {
  return d ? d.toString() : undefined
}

function getSortDirection(direction?: messageApi.SortDirection): SortDirection {
  if (direction === messageApi.SortDirection.SORT_DIRECTION_ASCENDING) {
    return SortDirection.ASCENDING
  }
  if (direction === messageApi.SortDirection.SORT_DIRECTION_DESCENDING) {
    return SortDirection.DESCENDING
  }

  return SortDirection.ASCENDING
}

function isAbortError(err?: RpcError): boolean {
  if (err?.code === "CANCELLED") {
    return true
  }
  return false
}

function isAuthError(err?: Error): boolean {
  if (!(err instanceof RpcError)) {
    return false
  }
  if (err?.code === "UNAUTHENTICATED") {
    return true
  }
  return false
}

function isNotAuthError(err?: Error): boolean {
  return !isAuthError(err)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
