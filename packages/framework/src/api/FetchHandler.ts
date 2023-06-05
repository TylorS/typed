import { flow, pipe } from '@effect/data/Function'
import type { Cause } from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import type { Layer } from '@effect/io/Layer'
import type { ParseOptions } from '@effect/schema/AST'
import * as ParseResult from '@effect/schema/ParseResult'
import { Schema, parseEffect } from '@effect/schema/Schema'
import type * as Context from '@typed/context'
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

export interface FetchHandler<out R, out E, in out Path extends string> {
  readonly route: Route.Route<Path>

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

export function FetchHandler<Path extends string, R2 = never, E2 = never>(
  route: Route.Route<Path>,
  handler: (request: Request, params: ParamsOf<Path>) => Effect.Effect<R2, E2, Response>,
  httpMethods: ReadonlySet<HttpMethod> = ALL_HTTP_METHODS,
): FetchHandler<R2, E2, Path> {
  return {
    route,
    handler,
    httpMethods,
    provideContext: (environment) =>
      FetchHandler(route, flow(handler, Effect.provideContext(environment)), httpMethods),
    provideLayer: <RI>(layer: Layer<RI, never, R2>) =>
      FetchHandler(route, flow(handler, Effect.provideLayer(layer)), httpMethods),
    provideSomeLayer: <RI, RO>(layer: Layer<RI, never, RO>) =>
      FetchHandler(route, flow(handler, Effect.provideSomeLayer(layer)), httpMethods),
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
      FetchHandler<Path, R2 | R3, E3>(
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

FetchHandler.decode = <Path extends string, A, R2, E2>(
  route: Route.Route<Path>,
  decoder: Decoder<unknown, A>,
  handler: (body: A, request: Request, params: ParamsOf<Path>) => Effect.Effect<R2, E2, Response>,
  options?: ParseOptions,
): FetchHandler<R2, E2 | ParseResult.ParseError, Path> =>
  FetchHandler(route, (request, params) =>
    Effect.gen(function* ($) {
      const result = yield* $(Effect.promise(() => request.json()))
      const parsed = yield* $(decoder(result, options))

      return yield* $(handler(parsed, request, params))
    }),
  )

FetchHandler.decodeText = <Path extends string, A, R2, E2>(
  route: Route.Route<Path>,
  decoder: Decoder<string, A>,
  handler: (body: A, request: Request, params: ParamsOf<Path>) => Effect.Effect<R2, E2, Response>,
  options?: ParseOptions,
): FetchHandler<R2, E2 | ParseResult.ParseError, Path> =>
  FetchHandler(route, (request, params) =>
    Effect.gen(function* ($) {
      const parseResult = yield* $(decoder(yield* $(Effect.promise(() => request.text())), options))

      return yield* $(handler(parseResult, request, params))
    }),
  )

FetchHandler.schema = <Path extends string, A, R2, E2>(
  route: Route.Route<Path>,
  schema: Schema<A>,
  handler: (body: A, request: Request, params: ParamsOf<Path>) => Effect.Effect<R2, E2, Response>,
  options?: ParseOptions,
): FetchHandler<R2, E2 | ParseResult.ParseError, Path> =>
  FetchHandler.decode(route, parseEffect(schema), handler, options)

export type ResourcesOf<T> = T extends FetchHandler<infer R, any, any> ? R : never

export type ErrorsOf<T> = T extends FetchHandler<any, infer E, any> ? E : never

export type PathOf<T> = T extends FetchHandler<any, any, infer P> ? P : never
