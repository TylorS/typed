import * as Effect from '@effect/io/Effect'
import { identity, pipe } from '@fp-ts/data/Function'
import type { Identity } from '@fp-ts/data/Identity'
import * as Context from '@typed/context'

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

export type FetchInput = RequestInfo | URL

export type FetchInit = Omit<RequestInit, 'signal'>

export const fetchResponse = (
  input: FetchInput,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, Response> => fetch_(identity, input, init)

export const fetchJson = (
  input: FetchInput,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, unknown> => fetch_((r) => r.then((r) => r.json()), input, init)

export const fetchText = (
  input: FetchInput,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, string> => fetch_((r) => r.then((r) => r.text()), input, init)

const fetch_ = <A>(
  f: (p: Promise<Response>) => Promise<A>,
  input: FetchInput,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, A> =>
  Fetch.withEffect((fetch) =>
    Effect.suspendSucceed(() => {
      const controller = new AbortController()
      const request = new Request(input, { ...init, signal: controller.signal })

      return pipe(
        Effect.tryCatchPromise(
          () => f(fetch(request)),
          (e) => FetchError(request, e),
        ),
        Effect.onInterrupt(() => Effect.sync(() => controller.abort())),
      )
    }),
  )
