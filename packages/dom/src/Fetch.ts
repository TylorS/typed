import * as Effect from '@effect/io/Effect'
import { identity, pipe } from '@fp-ts/data/Function'
import type { Identity } from '@fp-ts/data/Identity'
import * as These from '@fp-ts/data/These'
import type { DecodeError } from '@fp-ts/schema/DecodeError'
import { decoderFor } from '@fp-ts/schema/Decoder'
import type * as S from '@fp-ts/schema/Schema'
import * as Context from '@typed/context'

export interface Fetch extends Identity<(typeof globalThis)['fetch']> {}

export const Fetch = Context.Tag<Fetch>()

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

export interface FetchDecodeError {
  readonly _tag: 'FetchDecodeError'
  readonly request: Request
  readonly errors: readonly [DecodeError, ...DecodeError[]]
}

export const FetchDecodeError = (
  request: Request,
  errors: readonly [DecodeError, ...DecodeError[]],
): FetchDecodeError => ({
  _tag: 'FetchDecodeError',
  request,
  errors,
})

export type FetchInit = Omit<RequestInit, 'signal'>

export const fetchResponse = (
  input: RequestInfo | URL,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, Response> => fetch_(identity, input, init)

export const fetchJson = (
  input: RequestInfo | URL,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, unknown> => fetch_((r) => r.then((r) => r.json()), input, init)

export const fetchText = (
  input: RequestInfo | URL,
  init?: FetchInit,
): Effect.Effect<Fetch, FetchError, string> => fetch_((r) => r.then((r) => r.text()), input, init)

const fetch_ = <A>(
  f: (p: Promise<Response>) => Promise<A>,
  input: RequestInfo | URL,
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

export type FetchRequest<R, E, A> = (
  input: RequestInfo | URL,
  init?: FetchInit,
) => Effect.Effect<R | Fetch, E, A>

export const fetchWithSchema = <A>(
  schema: S.Schema<A>,
): FetchRequest<never, FetchError | FetchDecodeError, A> => {
  const decoder = decoderFor(schema)

  return (
    input: RequestInfo | URL,
    init?: FetchInit,
  ): Effect.Effect<Fetch, FetchError | FetchDecodeError, A> =>
    Fetch.withEffect((fetch) =>
      Effect.suspendSucceed(() => {
        const controller = new AbortController()
        const request = new Request(input, { ...init, signal: controller.signal })

        return pipe(
          Effect.tryCatchPromise(
            () =>
              fetch(request)
                .then((r) => r.json())
                .then(decoder.decode),
            (e) => FetchError(request, e),
          ),
          Effect.onInterrupt(() => Effect.sync(() => controller.abort())),
          Effect.flatMap(
            These.match(
              (errors) => Effect.fail(FetchDecodeError(request, errors)),
              Effect.succeed,
              (errors, a) =>
                pipe(
                  // TODO: Add better logging here when DecodeErrors can be stringified nicely
                  Effect.log(
                    `Request to ${request.url} encountered some unexpected issues: ${JSON.stringify(
                      errors,
                      null,
                      2,
                    )}`,
                  ),
                  Effect.as(a),
                ),
            ),
          ),
        )
      }),
    )
}
