import { type Effect, provideSomeLayer, provideLayer } from '@effect/io/Effect'
import type { Layer } from '@effect/io/Layer'
import { flow, pipe } from '@fp-ts/data/Function'
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

export interface FetchHandler<R, Path extends string> {
  readonly route: Route.Route<R, Path>

  readonly handler: (request: Request, params: ParamsOf<Path>) => Effect<R, never, Response>

  readonly httpMethods: ReadonlySet<HttpMethod>

  readonly provideLayer: <RI>(layer: Layer<RI, never, R>) => FetchHandler<RI, Path>

  readonly provideSomeLayer: <RI, RO>(
    layer: Layer<RI, never, RO>,
  ) => FetchHandler<RI | Exclude<R, RO>, Path>

  readonly setHttpMethods: (httpMethods: ReadonlySet<HttpMethod>) => FetchHandler<R, Path>
}

export function FetchHandler<R, Path extends string, R2 = never>(
  route: Route.Route<R, Path>,
  handler: (request: Request, params: ParamsOf<Path>) => Effect<R2, never, Response>,
  httpMethods: ReadonlySet<HttpMethod> = ALL_HTTP_METHODS,
): FetchHandler<R | R2, Path> {
  return {
    route,
    handler,
    httpMethods,
    provideLayer: <RI>(layer: Layer<RI, never, R | R2>) =>
      FetchHandler(pipe(route, Route.provideSomeLayer(layer)), flow(handler, provideLayer(layer))),
    provideSomeLayer: <RI, RO>(layer: Layer<RI, never, RO>) =>
      FetchHandler(
        pipe(route, Route.provideSomeLayer(layer)),
        flow(handler, provideSomeLayer(layer)),
      ),
    setHttpMethods: (httpMethods) => FetchHandler(route, handler, httpMethods),
  }
}
