import * as Effect from '@effect/io/Effect'
import * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import { Identity } from '@fp-ts/data/Identity'
import * as These from '@fp-ts/data/These'
import { DecodeError } from '@fp-ts/schema/DecodeError'
import { decoderFor } from '@fp-ts/schema/Decoder'
import * as S from '@fp-ts/schema/Schema'
import * as Fx from '@typed/fx'

// TODO: Handle progress events with readable streams
// TODO: Integrate with Query ?
// TODO: Integrate with @fp-ts/schema

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

export namespace Fetch {
  export const Tag: Context.Tag<Fetch> = Context.Tag<Fetch>()

  export type Error = FetchError
  export const Error = FetchError

  export type DecodeError = FetchDecodeError
  export const DecodeError = FetchDecodeError

  export const access = Effect.serviceWith(Tag)
  export const accessEffect = Effect.serviceWithEffect(Tag)
  export const accessFx = Fx.serviceWithFx(Tag)

  export const provide = Effect.provideService(Tag)
}

export const fetchResponse = (
  input: RequestInfo | URL,
  init?: Omit<RequestInit, 'signal'>,
): Effect.Effect<Fetch, FetchError, Response> => fetch_((r) => r, input, init)

export const fetchJson = (
  input: RequestInfo | URL,
  init?: Omit<RequestInit, 'signal'>,
): Effect.Effect<Fetch, FetchError, unknown> => fetch_((r) => r.then((r) => r.json()), input, init)

export const fetchText = (
  input: RequestInfo | URL,
  init?: Omit<RequestInit, 'signal'>,
): Effect.Effect<Fetch, FetchError, string> => fetch_((r) => r.then((r) => r.text()), input, init)

const fetch_ = <A>(
  f: (p: Promise<Response>) => Promise<A>,
  input: RequestInfo | URL,
  init?: Omit<RequestInit, 'signal'>,
): Effect.Effect<Fetch, FetchError, A> =>
  Fetch.accessEffect((fetch) =>
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

export const fetchWith = <A>(schema: S.Schema<A>) => {
  const decoder = decoderFor(schema)

  return (
    input: RequestInfo | URL,
    init?: Omit<RequestInit, 'signal'>,
  ): Effect.Effect<Fetch, Fetch.Error | Fetch.DecodeError, A> =>
    Fetch.accessEffect((fetch) =>
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
