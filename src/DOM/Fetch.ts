import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Identity } from '@tsplus/stdlib/prelude/Identity'
import * as T from '@tsplus/stdlib/service/Tag'

// TODO: Handle progress events with readable streams
// TODO: Integrate with Query ?
// TODO: Integrate with @fp-ts/codec when it is complete.

export interface Fetch extends Identity<typeof globalThis['fetch']> {}

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

export namespace Fetch {
  export const Tag: T.Tag<Fetch> = T.Tag<Fetch>()

  export type Error = FetchError
  export const Error = FetchError
}

export const fetch = (
  input: RequestInfo | URL,
  init?: Omit<RequestInit, 'signal'>,
): Effect.Effect<Fetch, FetchError, Response> => fetch_((f, r) => f(r), input, init)

export const fetchJson = (
  input: RequestInfo | URL,
  init?: Omit<RequestInit, 'signal'>,
): Effect.Effect<Fetch, FetchError, unknown> =>
  fetch_((f, r) => f(r).then((r) => r.json()), input, init)

export const fetchText = (
  input: RequestInfo | URL,
  init?: Omit<RequestInit, 'signal'>,
): Effect.Effect<Fetch, FetchError, string> =>
  fetch_((f, r) => f(r).then((r) => r.text()), input, init)

const fetch_ = <A>(
  f: (fetch: Fetch, request: Request) => Promise<A>,
  input: RequestInfo | URL,
  init?: Omit<RequestInit, 'signal'>,
): Effect.Effect<Fetch, FetchError, A> =>
  Effect.serviceWithEffect(Fetch.Tag, (fetch) =>
    Effect.suspendSucceed(() => {
      const controller = new AbortController()
      const request = new Request(input, { ...init, signal: controller.signal })

      return pipe(
        Effect.tryCatchPromise(
          () => f(fetch, request),
          (e) => FetchError(request, e),
        ),
        Effect.onInterrupt(() => Effect.sync(() => controller.abort())),
      )
    }),
  )
