import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { ParseOptions } from '@effect/schema/AST'
import * as ParseResult from '@effect/schema/ParseResult'
import * as Context from '@typed/context'
import type { Decoder } from '@typed/decoder'

type Identity<A> = A

export interface Fetch extends Identity<(typeof globalThis)['fetch']> {}

export const Fetch = Context.Tag<Fetch>('@typed/dom/Fetch')

export interface FetchError {
  readonly _tag: 'FetchError'
  readonly request: Request
  readonly error: unknown
}

export const FetchError = (request: Request, error: unknown): FetchError => ({
  _tag: 'FetchError',
  request,
  error,
})

export type FetchInput = Request | string | URL

export type FetchInit = Omit<RequestInit, 'signal'>

export function fetchResponse(
  input: FetchInput,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, Response> {
  return fetch_((_, res) => res, input, init)
}

export function fetchJson(
  input: FetchInput,
  init?: FetchInit,
  controller?: AbortController,
): Effect.Effect<Fetch, FetchError, FetchJsonResponse> {
  return fetch_(
    (_, res) => res.json().then((body) => toFetchJsonResponse(res, body)),
    input,
    init,
    controller,
  )
}

const toFetchJsonResponse = (r: Response, body: unknown): FetchJsonResponse => ({
  _tag: 'FetchJsonResponse',
  ok: r.ok,
  redirected: r.redirected,
  url: r.url,
  status: r.status,
  statusText: r.statusText,
  headers: fromHeaders(r.headers),
  body,
})

const fromHeaders = (headers: Headers): Readonly<Record<string, string>> => {
  const result: Record<string, string> = {}

  headers.forEach((value, key) => (result[key] = value))

  return result
}

export interface FetchJsonResponse<A = unknown> {
  readonly _tag: 'FetchJsonResponse'
  readonly ok: boolean
  readonly redirected: boolean
  readonly url: string
  readonly status: number
  readonly statusText: string
  readonly headers: Readonly<Record<string, string>>
  readonly body: A
}

export type FetchDecodeInit = FetchInit & ParseOptions

fetchJson.decode = <A>(
  input: FetchInput,
  decoder: Decoder<unknown, A>,
  init?: FetchDecodeInit,
): Effect.Effect<Fetch, FetchError | ParseResult.ParseError, FetchJsonResponse<A>> =>
  Effect.gen(function* ($) {
    const [request, controller] = createRequest(input, init)
    const { body, ...rest } = yield* $(fetchJson(request, undefined, controller))
    const result = yield* $(decoder(body, init))

    return { ...rest, body: result }
  })

export function fetchText(
  input: FetchInput,
  init?: FetchInit,
  controller?: AbortController,
): Effect.Effect<Fetch, FetchError, FetchTextResponse> {
  return fetch_(
    (_, r) =>
      r.text().then(
        (body): FetchTextResponse => ({
          _tag: 'FetchTextResponse',
          ok: r.ok,
          redirected: r.redirected,
          url: r.url,
          status: r.status,
          statusText: r.statusText,
          headers: fromHeaders(r.headers),
          body,
        }),
      ),
    input,
    init,
    controller,
  )
}

fetchText.decode = <A>(
  input: FetchInput,
  decoder: Decoder<string, A>,
  init?: FetchDecodeInit,
): Effect.Effect<Fetch, FetchError | ParseResult.ParseError, FetchJsonResponse<A>> =>
  Effect.gen(function* ($) {
    const [request, controller] = createRequest(input, init)
    const { body, ...rest } = yield* $(fetchText(request, undefined, controller))
    const result = yield* $(decoder(body, init))

    return { ...rest, _tag: 'FetchJsonResponse', body: result }
  })

export interface FetchTextResponse {
  readonly _tag: 'FetchTextResponse'
  readonly ok: boolean
  readonly redirected: boolean
  readonly url: string
  readonly status: number
  readonly statusText: string
  readonly headers: Readonly<Record<string, string>>
  readonly body: string
}

const createRequest = (
  input: FetchInput,
  init?: FetchInit,
  controller: AbortController = new AbortController(),
) => {
  const request = new Request(input, { ...init, signal: controller.signal })

  return [request, controller] as const
}

const fetch_ = <A>(
  f: (request: Request, response: Response) => A | Promise<A>,
  input: FetchInput,
  init?: FetchInit,
  optionalController?: AbortController,
): Effect.Effect<Fetch, FetchError, A> =>
  Fetch.withEffect((fetch) =>
    Effect.suspend(() => {
      const [request, controller] = createRequest(input, init, optionalController)

      return pipe(
        Effect.tryPromise({
          try: () => fetch(request).then((response) => f(request, response)),
          catch: (e) => FetchError(request, e),
        }),
        Effect.onInterrupt(() => Effect.sync(() => controller.abort())),
      )
    }),
  )
