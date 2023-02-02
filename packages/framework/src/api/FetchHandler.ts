import type { Cause } from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import type { Layer } from '@effect/io/Layer'
import { flow, pipe } from '@fp-ts/core/Function'
import type { NonEmptyReadonlyArray } from '@fp-ts/core/ReadonlyArray'
import type { ParseOptions } from '@fp-ts/schema/AST'
import { isFailure, type ParseError } from '@fp-ts/schema/ParseResult'
import { formatErrors } from '@fp-ts/schema/formatter/Tree'
import type { Decoder } from '@typed/decoder'
import type { ParamsOf } from '@typed/path'
import * as Route from '@typed/route'

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options'

export const ALL_HTTP_METHODS: ReadonlySet<HttpMethod> = new Set([
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',
])

export interface FetchHandler<R, E, Path extends string> {
  readonly route: Route.Route<R, Path>

  readonly handler: (request: Request, params: ParamsOf<Path>) => Effect.Effect<R, E, Response>

  readonly httpMethods: ReadonlySet<HttpMethod>

  readonly provideLayer: <RI>(layer: Layer<RI, never, R>) => FetchHandler<RI, E, Path>

  readonly provideSomeLayer: <RI, RO>(
    layer: Layer<RI, never, RO>,
  ) => FetchHandler<RI | Exclude<R, RO>, E, Path>

  readonly catchAllCause: <R2, E2>(
    f: (cause: Cause<E>) => Effect.Effect<R2, E2, Response>,
  ) => FetchHandler<R | R2, E2, Path>

  readonly catchAll: <R2, E2>(
    f: (error: E) => Effect.Effect<R2, E2, Response>,
  ) => FetchHandler<R | R2, E2, Path>

  readonly setHttpMethods: (httpMethods: Iterable<HttpMethod>) => FetchHandler<R, E, Path>
}

export function FetchHandler<R, Path extends string, R2 = never, E = never>(
  route: Route.Route<R, Path>,
  handler: (request: Request, params: ParamsOf<Path>) => Effect.Effect<R2, E, Response>,
  httpMethods: ReadonlySet<HttpMethod> = ALL_HTTP_METHODS,
): FetchHandler<R | R2, E, Path> {
  return {
    route,
    handler,
    httpMethods,
    provideLayer: <RI>(layer: Layer<RI, never, R | R2>) =>
      FetchHandler(
        pipe(route, Route.provideLayer(layer)),
        flow(handler, Effect.provideLayer(layer)),
        httpMethods,
      ),
    provideSomeLayer: <RI, RO>(layer: Layer<RI, never, RO>) =>
      FetchHandler(
        pipe(route, Route.provideSomeLayer(layer)),
        flow(handler, Effect.provideSomeLayer(layer)),
        httpMethods,
      ),
    catchAllCause: <R3, E2>(f: (cause: Cause<E>) => Effect.Effect<R3, E2, Response>) =>
      FetchHandler(route, flow(handler, Effect.catchAllCause(f)), httpMethods),
    catchAll: <R3, E2>(f: (error: E) => Effect.Effect<R3, E2, Response>) =>
      FetchHandler(route, flow(handler, Effect.catchAll(f)), httpMethods),
    setHttpMethods: (httpMethods) => FetchHandler(route, handler, new Set(httpMethods)),
  }
}

FetchHandler.decode = <R, Path extends string, A, R2, E>(
  route: Route.Route<R, Path>,
  decoder: Decoder<unknown, A>,
  handler: (request: Request, body: A, params: ParamsOf<Path>) => Effect.Effect<R2, E, Response>,
  options?: ParseOptions,
): FetchHandler<R | R2, E | DecodeError, Path> =>
  FetchHandler(route, (request, params) =>
    Effect.gen(function* ($) {
      const parseResult = decoder(yield* $(Effect.promise(() => request.json())), options)

      if (isFailure(parseResult)) {
        return yield* $(Effect.fail(new DecodeError(parseResult.left)))
      }

      return yield* $(handler(request, parseResult.right, params))
    }),
  )

FetchHandler.decodeText = <R, Path extends string, A, R2, E>(
  route: Route.Route<R, Path>,
  decoder: Decoder<string, A>,
  handler: (request: Request, body: A, params: ParamsOf<Path>) => Effect.Effect<R2, E, Response>,
  options?: ParseOptions,
): FetchHandler<R | R2, E | DecodeError, Path> =>
  FetchHandler(route, (request, params) =>
    Effect.gen(function* ($) {
      const parseResult = decoder(yield* $(Effect.promise(() => request.text())), options)

      if (isFailure(parseResult)) {
        return yield* $(Effect.fail(new DecodeError(parseResult.left)))
      }

      return yield* $(handler(request, parseResult.right, params))
    }),
  )

export class DecodeError extends Error {
  readonly _tag = 'DecodeError' as const

  constructor(readonly errors: NonEmptyReadonlyArray<ParseError>) {
    super(formatErrors(errors))
  }
}
