import * as Effect from '@effect/io/Effect'
import type * as Request from '@effect/io/Request'
import * as RequestResolver from '@effect/io/RequestResolver'
import type { ParseError } from '@effect/schema/ParseResult'
import type { Schema } from '@effect/schema/Schema'
import type { Decoder } from '@typed/decoder'

import {
  Fetch,
  type FetchError,
  type FetchJsonResponse,
  type FetchInit,
  type FetchInput,
  FetchTextResponse,
} from '../Fetch.js'

import { FetchDataSource } from './Request/DataSource.js'
import {
  FetchDecodeJson,
  FetchDecodeText,
  FetchJson,
  FetchRequest,
  FetchSchema,
  FetchText,
} from './Request/Request.js'

export * from './Request/Request.js'

const resolver = Effect.map(Fetch, (fetch) =>
  RequestResolver.provideContext(FetchDataSource, Fetch.context(fetch)),
)

export function request<Q extends FetchRequest<any>>(
  request: Q,
): Effect.Effect<Fetch, Request.Request.Error<Q>, Request.Request.Success<Q>> {
  return Effect.request(request, resolver)
}

export function fetchJson(
  input: FetchInput,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, FetchJsonResponse<unknown>> {
  return request(FetchJson(input, init))
}

export function fetchText(
  input: FetchInput,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, FetchTextResponse> {
  return request(FetchText(input, init))
}

export function fetchDecodeJson<A>(
  input: FetchInput,
  decoder: Decoder<unknown, A>,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError | ParseError, FetchJsonResponse<A>> {
  return request(FetchDecodeJson(input, decoder, init))
}

export function fetchDecodeText<A>(
  input: FetchInput,
  decoder: Decoder<string, A>,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError | ParseError, FetchJsonResponse<A>> {
  return request(FetchDecodeText(input, decoder, init))
}

export function fetchSchema<I, A>(
  input: FetchInput,
  schema: Schema<I, A>,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError | ParseError, FetchJsonResponse<A>> {
  return request(FetchSchema(input, schema, init))
}
