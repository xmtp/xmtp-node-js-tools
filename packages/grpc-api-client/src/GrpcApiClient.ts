import { MessageApiClient } from "./gen/message_api/v1/message_api.client.js"
import { GrpcTransport } from "@protobuf-ts/grpc-transport"
import { messageApi, fetcher } from "@xmtp/proto"
import { credentials } from "@grpc/grpc-js"
import {
  BatchQueryRequest,
  BatchQueryResponse,
  Cursor,
  Envelope,
  PagingInfo,
  PublishRequest,
  QueryRequest,
  QueryResponse,
  SortDirection,
} from "./gen/message_api/v1/message_api.js"
import {
  PublishParams,
  SubscribeParams,
  QueryParams,
  QueryAllOptions,
  QueryStreamOptions,
  Query,
  SubscribeCallback,
  UnsubscribeFn,
  IApiClient,
  Authenticator,
  AuthCache,
  NetworkOptions,
} from "@xmtp/xmtp-js"
import { RpcError } from "@protobuf-ts/runtime-rpc"
const { b64Encode } = fetcher

const API_URLS: { [k: string]: string } = {
  dev: "dev.xmtp.network:5556",
  production: "production.xmtp.network:5556",
  local: "localhost:5557",
}

export default class GrpcApiClient implements IApiClient {
  grpcClient: MessageApiClient
  private authCache?: AuthCache
  private appVersion?: string

  constructor(apiUrl: string, isSecure: boolean, appVersion?: string) {
    this.appVersion = appVersion
    this.grpcClient = new MessageApiClient(
      new GrpcTransport({
        host: apiUrl,
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
    return new GrpcApiClient(apiUrl, isSecure)
  }

  private async _publish(req: PublishRequest) {
    const token = await this.getToken()
    return this.grpcClient
      .publish(req, {
        meta: { /* ...this.metadata(), */ authorization: `Bearer ${token}` },
      })
      .then((res) => res.response)
  }

  private _query(req: QueryRequest): Promise<QueryResponse> {
    return this.grpcClient
      .query(req /* { meta: this.metadata() } */)
      .then((res) => res.response)
  }

  private _batchQuery(req: BatchQueryRequest): Promise<BatchQueryResponse> {
    return this.grpcClient
      .batchQuery(req, { meta: this.metadata() })
      .then((res) => res.response)
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
  ): UnsubscribeFn {
    const { contentTopics } = params
    const req = {
      contentTopics,
    }
    const abortController = new AbortController()
    const doSubscribe = async () => {
      while (true) {
        try {
          const stream = this.grpcClient.subscribe(req, {
            timeout: 1000 * 60 * 60 * 24,
            abort: abortController.signal,
          })
          stream.responses.onMessage((msg) => callback(toHttpEnvelope(msg)))
          await stream
        } catch (e) {
          if (isAbortError(e as RpcError)) {
            console.log("Stream aborted")
            return
          }
          console.error("stream error", e)
        }
      }
    }

    doSubscribe()

    return async () => {
      abortController.abort()
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
    message: b64Encode(
      env.message,
      0,
      env.message.length,
    ) as unknown as Uint8Array,
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
