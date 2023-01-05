import * as Effect from '@effect/io/Effect'
import { identity, pipe } from '@fp-ts/data/Function'
import { Identity } from '@fp-ts/data/Identity'
import * as Option from '@fp-ts/data/Option'
import * as These from '@fp-ts/data/These'
import { DecodeError } from '@fp-ts/schema/DecodeError'
import { decoderFor } from '@fp-ts/schema/Decoder'
import * as S from '@fp-ts/schema/Schema'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'

export interface Fetch extends Identity<typeof globalThis['fetch']> {}

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

/**
 * Fetch a response and return the raw body as a Uint8Array. This is returned as a
 * pair of a Progress indicating if the response is complete and the body currently received
 * as a Uint8Array. This allows checking .length on the Uint8Array to understand progress
 */
export const fetchRawBody = (
  input: RequestInfo | URL,
  init: FetchInit,
): Fx.Fx<Fetch, FetchError, readonly [Progress, Uint8Array]> =>
  Fx.gen(function* ($) {
    const response = yield* $(fetchResponse(input, init))
    const total = pipe(
      Option.fromNullable(response.headers.get('content-length')),
      Option.map(parseFloat),
    )
    const body = yield* $(
      Fx.makeRef((): readonly [Progress, Uint8Array] => [{ loaded: 0, total }, new Uint8Array(0)]),
    )

    // Read the response until completion
    if (response.body) {
      yield* $(
        Effect.forkScoped(
          Effect.gen(function* ($) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const reader = response.body!.getReader()

            // eslint-disable-next-line no-constant-condition
            while (true) {
              const result = yield* $(Effect.promise(() => reader.read()))

              // If we're done, end the stream
              if (result.done) {
                return yield* $(body.end)
              }

              const { value } = result

              // Update the body with the new progress and currently loaded Uint8Array
              yield* $(
                body.update(([{ loaded }, current]) => [
                  { loaded: loaded + value.length, total },
                  concatUint8Array(current, value),
                ]),
              )
            }
          }),
        ),
      )

      return body
    }

    // Otherwise return an empty body
    return Fx.succeed([{ loaded: 0, total: Option.some(0) }, new Uint8Array(0)])
  })

export interface Progress {
  readonly loaded: number
  readonly total: Option.Option<number>
}

function concatUint8Array(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length)
  c.set(a, 0)
  c.set(b, a.length)
  return c
}
