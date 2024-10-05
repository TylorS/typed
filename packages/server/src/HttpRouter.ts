/**
 * @since 1.0.0
 */

import type { HttpApp, HttpMethod, HttpServerError, HttpServerResponse } from "@effect/platform"
import { HttpRouter as PlatformHttpRouter, HttpServerRespondable } from "@effect/platform"
import * as Context from "@typed/context"
import type * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import type * as TypedRouter from "@typed/router"
import * as MatchInput from "@typed/router/MatchInput"
import type { Scope } from "effect"
import { Layer } from "effect"
import type * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import type { Mutable } from "effect/Types"
import * as HttpRouteHandler from "./HttpRouteHandler.js"
import { RouterImpl, RouterTypeId, runRouteMatcher, setupRouteContext } from "./internal/router.js"

/* eslint-disable @typescript-eslint/no-empty-object-type */

/**
 * @since 1.0.0
 */
export interface HttpRouter<E, R> extends
  HttpApp.Default<
    E | HttpServerError.HttpServerError,
    | TypedRouter.CurrentRoute
    | Exclude<R, HttpRouteHandler.CurrentParams<any> | Navigation.Navigation>
  >
{
  readonly [RouterTypeId]: RouterTypeId
  readonly routes: Chunk.Chunk<
    HttpRouteHandler.HttpRouteHandler<MatchInput.MatchInput.Any, E, R>
  >
  readonly mounts: Chunk.Chunk<Mount<E, R>>
}
/**
 * @since 1.0.0
 */
export namespace HttpRouter {
  /**
   * @since 1.0.0
   */
  export type DefaultServices = TypedRouter.CurrentRoute

  /**
   * @since 1.0.0
   */
  export type Provided =
    | HttpRouteHandler.CurrentParams<any>
    | Navigation.Navigation

  /**
   * @since 1.0.0
   */
  export type ExcludeProvided<R> = Exclude<
    R,
    HttpRouteHandler.CurrentParams<any> | Navigation.Navigation
  >

  /**
   * @since 1.0.0
   */
  export interface Service<E, R> {
    readonly router: Effect.Effect<HttpRouter<E, R>>
    readonly addHandler: <R2 extends MatchInput.MatchInput.Any>(
      handler: HttpRouteHandler.HttpRouteHandler<R2, E, R>
    ) => Effect.Effect<void>

    readonly mount: <R2 extends MatchInput.MatchInput.Any>(
      prefix: R2,
      app: HttpRouter<E, R>,
      options?: { readonly includePrefix?: boolean | undefined }
    ) => Effect.Effect<void>

    readonly mountApp: <R2 extends MatchInput.MatchInput.Any>(
      prefix: R2,
      app: HttpApp.Default<E, R>,
      options?: { readonly includePrefix?: boolean | undefined }
    ) => Effect.Effect<void>

    readonly concat: (that: HttpRouter<E, R>) => Effect.Effect<void>
  }

  /**
   * @since 1.0.0
   */
  export interface TagClass<Self, Name extends string, E, R> extends Context.TagClass<Self, Name, Service<E, R>> {
    readonly Live: Layer.Layer<Self>
    readonly router: Effect.Effect<HttpRouter<E, R>, never, Self>
    readonly use: <XA, XE, XR>(
      f: (router: Service<E, R>) => Effect.Effect<XA, XE, XR>
    ) => Layer.Layer<never, XE, XR>
    readonly useScoped: <XA, XE, XR>(
      f: (router: Service<E, R>) => Effect.Effect<XA, XE, XR>
    ) => Layer.Layer<never, XE, Exclude<XR, Scope.Scope>>
    readonly unwrap: <XA, XE, XR>(
      f: (router: HttpRouter<E, R>) => Layer.Layer<XA, XE, XR>
    ) => Layer.Layer<XA, XE, XR>
  }
}

/**
 * @since 1.0.0
 */
export class Mount<E, R> {
  constructor(
    readonly prefix: MatchInput.MatchInput.Any,
    readonly app: HttpApp.Default<E, R>,
    readonly options?: { readonly includePrefix?: boolean | undefined }
  ) {}
}

/**
 * @since 1.0.0
 */
export const empty: HttpRouter<never, never> = new RouterImpl(
  Chunk.empty(),
  Chunk.empty()
)

/**
 * @since 1.0.0
 */
export const addHandler: {
  <I extends HttpRouteHandler.HttpRouteHandler.Any>(
    handler: I
  ): <E, R>(
    router: HttpRouter<E, R>
  ) => HttpRouter<
    E | HttpRouteHandler.HttpRouteHandler.Error<I>,
    R | HttpRouteHandler.HttpRouteHandler.Context<I>
  >

  <E, R, I extends HttpRouteHandler.HttpRouteHandler.Any>(
    router: HttpRouter<E, R>,
    handler: I
  ): HttpRouter<
    E | HttpRouteHandler.HttpRouteHandler.Error<I>,
    R | HttpRouteHandler.HttpRouteHandler.Context<I>
  >
} = dual(
  2,
  <E, R, I extends HttpRouteHandler.HttpRouteHandler.Any>(
    router: HttpRouter<E, R>,
    handler: I
  ): HttpRouter<
    E | HttpRouteHandler.HttpRouteHandler.Error<I>,
    R | HttpRouteHandler.HttpRouteHandler.Context<I>
  > => {
    return new RouterImpl<
      E | HttpRouteHandler.HttpRouteHandler.Error<I>,
      R | HttpRouteHandler.HttpRouteHandler.Context<I>,
      E,
      R
    >(Chunk.append(router.routes, handler), router.mounts)
  }
)

const make = (method: HttpMethod.HttpMethod | "*") =>
<I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => addHandler(HttpRouteHandler.make(method)(route, handler))

/**
 * @since 1.0.0
 */
export const get: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<
    Exclude<R2, HttpRouteHandler.CurrentParams<I>>,
    Navigation.Navigation
  >
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("GET")

/**
 * @since 1.0.0
 */
export const post: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<
    Exclude<R2, HttpRouteHandler.CurrentParams<I>>,
    Navigation.Navigation
  >
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("POST")

/**
 * @since 1.0.0
 */
export const put: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<
    Exclude<R2, HttpRouteHandler.CurrentParams<I>>,
    Navigation.Navigation
  >
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("PUT")

const delete_: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E | E2 | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<
    Exclude<R2, HttpRouteHandler.CurrentParams<I>>,
    Navigation.Navigation
  >
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("DELETE")

export {
  /**
   * @since 1.0.0
   */
  delete_ as delete
}

/**
 * @since 1.0.0
 */
export const patch: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  HttpRouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<
    Exclude<R2, HttpRouteHandler.CurrentParams<I>>,
    Navigation.Navigation
  >
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("PATCH")

/**
 * @since 1.0.0
 */
export const options: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<
    Exclude<R2, HttpRouteHandler.CurrentParams<I>>,
    Navigation.Navigation
  >
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("OPTIONS")

/**
 * @since 1.0.0
 */
export const head: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<
    Exclude<R2, HttpRouteHandler.CurrentParams<I>>,
    Navigation.Navigation
  >
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("HEAD")

/**
 * @since 1.0.0
 */
export const all: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<
    Exclude<R2, HttpRouteHandler.CurrentParams<I>>,
    Navigation.Navigation
  >
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("*")

/**
 * @since 1.0.0
 */
export const mountApp: {
  <Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    prefix: Prefix,
    app: HttpApp.Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): <E, R>(router: HttpRouter<E, R>) => HttpRouter<E2 | E, R2 | R>

  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    router: HttpRouter<E, R>,
    prefix: Prefix,
    app: HttpApp.Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): HttpRouter<E | E2, R | R2>
} = dual(
  (args) => typeof args[0] === "object" && RouterTypeId in args[0],
  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    router: HttpRouter<E, R>,
    prefix: Prefix,
    app: HttpApp.Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): HttpRouter<E | E2, R | R2> => {
    const prefixRoute = getRouteGuard(prefix)

    return new RouterImpl<E, R, E | E2, R | R2>(
      router.routes,
      Chunk.append(router.mounts, new Mount(prefixRoute, app, options))
    )
  }
)

/**
 * @since 1.0.0
 */
export const mount: {
  <Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    prefix: Prefix,
    router: HttpRouter<E2, R2>
  ): <E, R>(parentRouter: HttpRouter<E, R>) => HttpRouter<E | E2, R | R2>

  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    parentRouter: HttpRouter<E, R>,
    prefix: Prefix,
    router: HttpRouter<E2, R2>
  ): HttpRouter<E | E2, R | R2>
} = dual(
  3,
  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    parentRouter: HttpRouter<E, R>,
    prefix: Prefix,
    router: HttpRouter<E2, R2>
  ): HttpRouter<E | E2, R | R2> => {
    const prefixRoute = getRouteGuard(prefix)

    return new RouterImpl<E | E2, R | R2, E | E2, R | R2>(
      Chunk.appendAll(
        parentRouter.routes,
        Chunk.map(router.routes, (r) =>
          HttpRouteHandler.make(r.method)(
            MatchInput.concat(prefixRoute, r.route),
            r.handler
          ))
      ),
      Chunk.appendAll(
        parentRouter.mounts,
        Chunk.map(
          router.mounts,
          (m) =>
            new Mount(
              MatchInput.concat(prefixRoute, m.prefix),
              m.app,
              m.options
            )
        )
      )
    )
  }
)

function getRouteGuard<const I extends MatchInput.MatchInput.Any | string>(
  routeOrPath: I
) {
  if (typeof routeOrPath === "string") {
    return MatchInput.asRouteGuard(Route.parse(routeOrPath))
  }
  return MatchInput.asRouteGuard(routeOrPath)
}

/**
 * Note this will only function properly if your route's paths are compatible with the platform router.
 *
 * @since 1.0.0
 */
export const toPlatformRouter = <E, R>(
  router: HttpRouter<E, R>
): PlatformHttpRouter.HttpRouter<
  E | HttpServerError.RouteNotFound | HttpRouteHandler.RouteNotMatched,
  TypedRouter.CurrentRoute | R
> => {
  let platformRouter: PlatformHttpRouter.HttpRouter<
    E | HttpRouteHandler.RouteNotMatched,
    R | TypedRouter.CurrentRoute
  > = PlatformHttpRouter.empty

  for (const mount of router.mounts) {
    platformRouter = PlatformHttpRouter.mountApp(
      platformRouter,
      // TODO: Maybe we should do a best-effort to convert the path to a platform compatible path
      MatchInput.getPath(mount.prefix) as any,
      Effect.gen(function*() {
        const ctx = yield* setupRouteContext
        const response = yield* runRouteMatcher<E, R>(
          mount.prefix,
          mount.app,
          ctx.path,
          ctx.url,
          ctx.existingParams
        )

        if (Option.isSome(response)) {
          return response.value
        }

        return yield* new HttpRouteHandler.RouteNotMatched({
          request: ctx.request,
          route: mount.prefix
        })
      }),
      mount.options
    )
  }

  for (const routeHandler of router.routes) {
    platformRouter = HttpRouteHandler.toPlatformRoute(routeHandler)(platformRouter)
  }

  return platformRouter
}

/**
 * @since 1.0.0
 */
export const fromPlatformRouter = <E, R>(
  platformRouter: PlatformHttpRouter.HttpRouter<E, R>
): HttpRouter<E, R> => {
  let router: HttpRouter<any, any> = empty

  for (const [prefix, app, options] of platformRouter.mounts) {
    router = mountApp(router, Route.parse(prefix), app, options)
  }

  for (const platformRoute of platformRouter.routes) {
    router = addHandler(
      router,
      HttpRouteHandler.make(platformRoute.method)(
        Route.parse(platformRoute.path),
        platformRoute.handler.pipe(
          Effect.flatMap(HttpServerRespondable.toResponse)
        )
      )
    )
  }

  return router
}

/**
 * @since 1.0.0
 */
export const catchAllCause: {
  <E, E2, R2>(
    onCause: (
      cause: Cause.Cause<E>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): <R>(router: HttpRouter<E, R>) => HttpRouter<E2, R | R2>

  <E, R, E2, R2>(
    router: HttpRouter<E, R>,
    onCause: (
      cause: Cause.Cause<E>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2, R | R2>
} = dual(
  2,
  <E, R, E2, R2>(
    router: HttpRouter<E, R>,
    onCause: (
      cause: Cause.Cause<E>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2, R | R2> =>
    new RouterImpl(
      Chunk.map(router.routes, (handler) => HttpRouteHandler.catchAllCause(handler, onCause)),
      Chunk.map(
        router.mounts,
        (mount) =>
          new Mount(
            mount.prefix,
            Effect.catchAllCause(mount.app, onCause),
            mount.options
          )
      )
    )
)

/**
 * @since 1.0.0
 */
export const catchAll: {
  <E, E2, R2>(
    onCause: (
      cause: E
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): <R>(router: HttpRouter<E, R>) => HttpRouter<E2, R | R2>

  <E, R, E2, R2>(
    router: HttpRouter<E, R>,
    onCause: (
      cause: E
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2, R | R2>
} = dual(
  2,
  <E, R, E2, R2>(
    router: HttpRouter<E, R>,
    onCause: (
      cause: E
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2, R | R2> =>
    new RouterImpl(
      Chunk.map(router.routes, (handler) => HttpRouteHandler.catchAll(handler, onCause)),
      Chunk.map(
        router.mounts,
        (mount) =>
          new Mount(
            mount.prefix,
            Effect.catchAll(mount.app, onCause),
            mount.options
          )
      )
    )
)

/**
 * @since 1.0.0
 */
export const catchTag: {
  <
    E,
    const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never,
    E2,
    R2
  >(
    tag: Tag,
    onError: (
      error: Extract<E, { readonly _tag: Tag }>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): <R>(
    router: HttpRouter<E, R>
  ) => HttpRouter<E2 | Exclude<E, { readonly _tag: Tag }>, R | R2>

  <
    E,
    R,
    const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never,
    E2,
    R2
  >(
    router: HttpRouter<E, R>,
    tag: Tag,
    onError: (
      error: Extract<E, { readonly _tag: Tag }>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2 | Exclude<E, { readonly _tag: Tag }>, R | R2>
} = dual(
  3,
  <
    E,
    R,
    const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never,
    E2,
    R2
  >(
    router: HttpRouter<E, R>,
    tag: Tag,
    onError: (
      error: Extract<E, { readonly _tag: Tag }>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<Exclude<E, { readonly _tag: Tag }> | E2, R | R2> =>
    new RouterImpl(
      Chunk.map(router.routes, (handler) => HttpRouteHandler.catchTag(handler, tag, onError)),
      Chunk.map(
        router.mounts,
        (mount) =>
          new Mount(
            mount.prefix,
            Effect.catchTag(mount.app, tag as any, onError),
            mount.options
          )
      )
    )
)

/**
 * @since 1.0.0
 */
export const catchTags: {
  <
    E,
    Cases extends E extends { _tag: string } ? {
        [K in E["_tag"]]+?:
          | ((
            error: Extract<E, { _tag: K }>
          ) => HttpRouteHandler.Handler<any, any, any>)
          | undefined
      }
      : {}
  >(
    cases: Cases
  ): <R>(self: HttpRouter<E, R>) => HttpRouter<
    | Exclude<E, { _tag: keyof Cases }>
    | {
      [K in keyof Cases]: Cases[K] extends (
        ...args: Array<any>
      ) => Effect.Effect<any, infer E, any> ? E
        : never
    }[keyof Cases],
    | R
    | HttpRouter.ExcludeProvided<
      {
        [K in keyof Cases]: Cases[K] extends (
          ...args: Array<any>
        ) => Effect.Effect<any, any, infer R> ? R
          : never
      }[keyof Cases]
    >
  >
  <
    R,
    E,
    Cases extends E extends { _tag: string } ? {
        [K in E["_tag"]]+?:
          | ((
            error: Extract<E, { _tag: K }>
          ) => HttpRouteHandler.Handler<any, any, any>)
          | undefined
      }
      : {}
  >(
    self: HttpRouter<E, R>,
    cases: Cases
  ): HttpRouter<
    | Exclude<E, { _tag: keyof Cases }>
    | {
      [K in keyof Cases]: Cases[K] extends (
        ...args: Array<any>
      ) => Effect.Effect<any, infer E, any> ? E
        : never
    }[keyof Cases],
    | R
    | HttpRouter.ExcludeProvided<
      {
        [K in keyof Cases]: Cases[K] extends (
          ...args: Array<any>
        ) => Effect.Effect<any, any, infer R> ? R
          : never
      }[keyof Cases]
    >
  >
} = dual(
  2,
  <
    E,
    R,
    Cases extends E extends { _tag: string } ? {
        [K in E["_tag"]]+?:
          | ((
            error: Extract<E, { _tag: K }>
          ) => HttpRouteHandler.Handler<any, any, any>)
          | undefined
      }
      : {}
  >(
    router: HttpRouter<E, R>,
    cases: Cases
  ) =>
    new RouterImpl(
      Chunk.map(router.routes, (handler) => HttpRouteHandler.catchTags(handler, cases)),
      Chunk.map(
        router.mounts,
        (mount) =>
          new Mount(
            mount.prefix,
            Effect.flatMap(
              Effect.catchTags(mount.app, cases as any) as any,
              HttpServerRespondable.toResponse
            ),
            mount.options
          )
      )
    )
)

/**
 * @since 1.0.0
 */
export const append: {
  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ): (router: HttpRouter<E, R>) => HttpRouter<E | E2, R | R3>

  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    router: HttpRouter<E, R>,
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ): HttpRouter<E | E2, R | R3>
} = dual(
  2,
  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    router: HttpRouter<E, R>,
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ) =>
    new RouterImpl<E | E2, R | R3, E, R>(
      Chunk.append(router.routes, handler),
      router.mounts
    )
)

/**
 * @since 1.0.0
 */
export const prepend: {
  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ): (router: HttpRouter<E, R>) => HttpRouter<E | E2, R | R3>

  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    router: HttpRouter<E, R>,
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ): HttpRouter<E | E2, R | R3>
} = dual(
  2,
  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    router: HttpRouter<E, R>,
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ) =>
    new RouterImpl<E | E2, R | R3, E, R>(
      Chunk.prepend(router.routes, handler),
      router.mounts
    )
)

/**
 * @since 1.0.0
 */
export const concat: {
  <E2, R2>(
    router2: HttpRouter<E2, R2>
  ): <E, R>(router: HttpRouter<E, R>) => HttpRouter<E | E2, R | R2>

  <E, R, E2, R2>(
    router: HttpRouter<E, R>,
    router2: HttpRouter<E2, R2>
  ): HttpRouter<E | E2, R | R2>
} = dual(
  2,
  <E, R, E2, R2>(router: HttpRouter<E, R>, router2: HttpRouter<E2, R2>) =>
    new RouterImpl<E | E2, R | R2, E | E2, R | R2>(
      Chunk.appendAll(router.routes, router2.routes),
      Chunk.appendAll(router.mounts, router2.mounts)
    )
)

/**
 * @since 1.0.0
 */
export const Tag = <const Name extends string>(id: Name) =>
<Self, R = never, E = unknown>(): HttpRouter.TagClass<
  Self,
  Name,
  E,
  R | HttpRouter.DefaultServices
> => {
  const Err = globalThis.Error as any
  const limit = Err.stackTraceLimit
  Err.stackTraceLimit = 2
  const creationError = new Err()
  Err.stackTraceLimit = limit

  function TagClass() {}
  const TagClass_ = TagClass as any as Mutable<
    HttpRouter.TagClass<Self, Name, E, R>
  >
  Object.setPrototypeOf(
    TagClass,
    Object.getPrototypeOf(Context.Tag<Self, any>(id))
  )
  TagClass.key = id
  Object.defineProperty(TagClass, "stack", {
    get() {
      return creationError.stack
    }
  })
  TagClass_.Live = Layer.sync(TagClass_, makeService)
  TagClass_.router = Effect.flatMap(TagClass_, (_) => _.router)
  TagClass_.use = (f) =>
    Layer.effectDiscard(Effect.flatMap(TagClass_, f)).pipe(
      Layer.provide(TagClass_.Live)
    )
  TagClass_.useScoped = (f) =>
    TagClass_.pipe(
      Effect.flatMap(f),
      Layer.scopedDiscard,
      Layer.provide(TagClass_.Live)
    )
  TagClass_.unwrap = (f) =>
    TagClass_.pipe(
      Effect.flatMap((_) => _.router),
      Effect.map(f),
      Layer.unwrapEffect,
      Layer.provide(TagClass_.Live)
    )
  return TagClass as any
}

const makeService = <E, R>(): HttpRouter.Service<E, R> => {
  let router = empty as HttpRouter<E, R>
  return {
    router: Effect.sync(() => router),
    addHandler(handler) {
      return Effect.sync(() => {
        router = addHandler(router, handler) as any
      })
    },
    mount(path, that) {
      return Effect.sync(() => {
        router = mount(router, path, that)
      })
    },
    mountApp(path, app, options) {
      return Effect.sync(() => {
        router = mountApp(router, path, app, options)
      })
    },
    concat(that) {
      return Effect.sync(() => {
        router = concat(router, that)
      })
    }
  }
}

/**
 * @since 1.0.0
 */
export function fromIterable<E, R>(
  handlers: Iterable<HttpRouteHandler.HttpRouteHandler<any, E, R>>
): HttpRouter<E, R> {
  return new RouterImpl(Chunk.fromIterable(handlers), Chunk.empty())
}
