import type { HttpApp, HttpServerRequest } from "@effect/platform"
import type * as Router from "@typed/router"
import type { Layer } from "effect"
import * as HttpRouter from "./HttpRouter.js"
/**
 * The router that the API endpoints are attached to.
 *
 * @since 1.0.0
 * @category router
 */
export class HttpApiRouter extends HttpRouter.Tag("@typed/server/HttpApiBuilder/Router")<HttpApiRouter>() {}

/**
 * @since 1.0.0
 */
export const mountApp = <Prefix extends Router.MatchInput.Any, E, R>(
  prefix: Prefix,
  app: HttpApp.Default<E, R>
): Layer.Layer<never, never, Exclude<R, HttpServerRequest.HttpServerRequest> | HttpApiRouter> =>
  HttpApiRouter.use((router) => router.mountApp(prefix, app as any))

/**
 * @since 1.0.0
 */
export const mount = <Prefix extends Router.MatchInput.Any, E, R>(
  prefix: Prefix,
  router: HttpRouter.HttpRouter<E, R>
): Layer.Layer<never, never, Exclude<R, HttpServerRequest.HttpServerRequest> | HttpApiRouter> =>
  HttpApiRouter.use((httpApiRouter) => httpApiRouter.mount(prefix, router as any))

/**
 * @since 1.0.0
 */
export const layer: <E2, R2>(
  router: HttpRouter.HttpRouter<E2, R2>
) => Layer.Layer<HttpApiRouter, never, Exclude<R2, HttpServerRequest.HttpServerRequest>> = HttpApiRouter.layer as any

/**
 * @since 1.0.0
 */
export const concat = <E, R>(
  router: HttpRouter.HttpRouter<E, R>
): Layer.Layer<never, never, Exclude<R, HttpServerRequest.HttpServerRequest> | HttpApiRouter> =>
  HttpApiRouter.use((httpApiRouter) => httpApiRouter.concat(router as any))
