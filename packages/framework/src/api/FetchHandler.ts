import type { Cause } from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import type { Layer } from '@effect/io/Layer'
import { flow, pipe } from '@fp-ts/core/Function'
import type { ParseOptions } from '@fp-ts/schema/AST'
import { isFailure } from '@fp-ts/schema/ParseResult'
import { decode } from '@fp-ts/schema/Parser'
import type { Schema } from '@fp-ts/schema/Schema'
import type * as Context from '@typed/context'
import type { Decoder } from '@typed/decoder'
import { DecodeError } from '@typed/dom/Fetch'
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

export interface FetchHandler<out R, out E, in out Path extends string> {
  readonly route: Route.Route<R, never, Path>

  readonly handler: (request: Request, params: ParamsOf<Path>) => Effect.Effect<R, E, Response>

  readonly httpMethods: ReadonlySet<HttpMethod>

  readonly provideContext: (environment: Context.Context<R>) => FetchHandler<never, E, Path>

  readonly provideLayer: <RI>(layer: Layer<RI, never, R>) => FetchHandler<RI, E, Path>

  readonly provideSomeLayer: <RI, RO>(
    layer: Layer<RI, never, RO>,
  ) => FetchHandler<RI | Exclude<R, RO>, E, Path>

  readonly catchAllCause: <R2, E2>(
    f: (cause: Cause<E>, request: Request) => Effect.Effect<R2, E2, Response>,
  ) => FetchHandler<R | R2, E2, Path>

  readonly catchAll: <R2, E2>(
    f: (error: E, request: Request) => Effect.Effect<R2, E2, Response>,
  ) => FetchHandler<R | R2, E2, Path>

  readonly setHttpMethods: (httpMethods: Iterable<HttpMethod>) => FetchHandler<R, E, Path>
}

export function FetchHandler<R, Path extends string, R2 = never, E2 = never>(
  route: Route.Route<R, never, Path>,
  handler: (request: Request, params: ParamsOf<Path>) => Effect.Effect<R2, E2, Response>,
  httpMethods: ReadonlySet<HttpMethod> = ALL_HTTP_METHODS,
): FetchHandler<R | R2, E2, Path> {
  return {
    route,
    handler,
    httpMethods,
    provideContext: (environment) =>
      FetchHandler(
        pipe(route, Route.provideContext(environment)),
        flow(handler, Effect.provideContext(environment)),
        httpMethods,
      ),
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
    catchAllCause: <R3, E3>(
      f: (cause: Cause<E2>, request: Request) => Effect.Effect<R3, E3, Response>,
    ) =>
      FetchHandler(
        route,
        (request, params) =>
          pipe(
            handler(request, params),
            Effect.catchAllCause((e) => f(e, request)),
          ),
        httpMethods,
      ),
    catchAll: <R3, E3>(f: (error: E2, request: Request) => Effect.Effect<R3, E3, Response>) =>
      FetchHandler<R, Path, R2 | R3, E3>(
        route,
        (request, params) =>
          pipe(
            handler(request, params),
            Effect.catchAll((e) => f(e, request)),
          ),
        httpMethods,
      ),
    setHttpMethods: (httpMethods) => FetchHandler(route, handler, new Set(httpMethods)),
  }
}

FetchHandler.decode = <R, Path extends string, A, R2, E2>(
  route: Route.Route<R, never, Path>,
  decoder: Decoder<unknown, A>,
  handler: (body: A, request: Request, params: ParamsOf<Path>) => Effect.Effect<R2, E2, Response>,
  options?: ParseOptions,
): FetchHandler<R | R2, E2 | DecodeError, Path> =>
  FetchHandler(route, (request, params) =>
    Effect.gen(function* ($) {
      const parseResult = decoder(yield* $(Effect.promise(() => request.json())), options)

      if (isFailure(parseResult)) {
        return yield* $(Effect.fail(new DecodeError(request, parseResult.left)))
      }

      return yield* $(handler(parseResult.right, request, params))
    }),
  )

FetchHandler.decodeText = <R, Path extends string, A, R2, E2>(
  route: Route.Route<R, never, Path>,
  decoder: Decoder<string, A>,
  handler: (body: A, request: Request, params: ParamsOf<Path>) => Effect.Effect<R2, E2, Response>,
  options?: ParseOptions,
): FetchHandler<R | R2, E2 | DecodeError, Path> =>
  FetchHandler(route, (request, params) =>
    Effect.gen(function* ($) {
      const parseResult = decoder(yield* $(Effect.promise(() => request.text())), options)

      if (isFailure(parseResult)) {
        return yield* $(Effect.fail(new DecodeError(request, parseResult.left)))
      }

      return yield* $(handler(parseResult.right, request, params))
    }),
  )

FetchHandler.schema = <R, Path extends string, A, R2, E2>(
  route: Route.Route<R, never, Path>,
  schema: Schema<A>,
  handler: (body: A, request: Request, params: ParamsOf<Path>) => Effect.Effect<R2, E2, Response>,
  options?: ParseOptions,
): FetchHandler<R | R2, E2 | DecodeError, Path> =>
  FetchHandler.decode(route, decode(schema), handler, options)

export type ResourcesOf<T> = T extends FetchHandler<infer R, any, any> ? R : never

export type ErrorsOf<T> = T extends FetchHandler<any, infer E, any> ? E : never

export type PathOf<T> = T extends FetchHandler<any, any, infer P> ? P : never
