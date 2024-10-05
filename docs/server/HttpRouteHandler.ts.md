---
title: HttpRouteHandler.ts
nav_order: 16
parent: "@typed/server"
---

## HttpRouteHandler overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [CurrentParams (interface)](#currentparams-interface)
  - [Handler (type alias)](#handler-type-alias)
  - [HttpRouteHandler (interface)](#httproutehandler-interface)
  - [HttpRouteHandler (namespace)](#httproutehandler-namespace)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
  - [RouteNotMatched (class)](#routenotmatched-class)
  - [all](#all)
  - [catchAll](#catchall)
  - [catchAllCause](#catchallcause)
  - [catchTag](#catchtag)
  - [catchTags](#catchtags)
  - [currentParamsLayer](#currentparamslayer)
  - [delete](#delete)
  - [get](#get)
  - [getCurrentParams](#getcurrentparams)
  - [getCurrentParamsOption](#getcurrentparamsoption)
  - [getUrlFromServerRequest](#geturlfromserverrequest)
  - [head](#head)
  - [make](#make)
  - [options](#options)
  - [patch](#patch)
  - [post](#post)
  - [provide](#provide)
  - [provideService](#provideservice)
  - [put](#put)
  - [toHttpApp](#tohttpapp)
  - [toPlatformRoute](#toplatformroute)

---

# utils

## CurrentParams (interface)

**Signature**

```ts
export interface CurrentParams<I extends Router.MatchInput.Any = Router.MatchInput.Any> {
  readonly params: Router.MatchInput.Success<I>
  readonly queryParams: URLSearchParams
}
```

Added in v1.0.0

## Handler (type alias)

**Signature**

```ts
export type Handler<Route extends Router.MatchInput.Any, E, R> = HttpRouter.Route.Handler<
  E,
  R | Router.CurrentRoute | CurrentParams<Route> | Navigation.Navigation | HttpServerRequest.HttpServerRequest
>
```

Added in v1.0.0

## HttpRouteHandler (interface)

**Signature**

```ts
export interface HttpRouteHandler<Route extends Router.MatchInput.Any, E, R> {
  readonly method: HttpMethod.HttpMethod | "*"
  readonly route: Route
  readonly handler: Handler<Route, E, R>
}
```

Added in v1.0.0

## HttpRouteHandler (namespace)

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any = HttpRouteHandler<Router.MatchInput.Any, any, any>
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> =
  T extends HttpRouteHandler<infer I, any, infer R>
    ? Exclude<Exclude<R, CurrentParams<I>> | Router.MatchInput.Context<I>, Navigation.Navigation>
    : never
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> =
  T extends HttpRouteHandler<infer I, infer E, any> ? E | Router.MatchInput.Error<I> | RouteNotMatched : never
```

Added in v1.0.0

## RouteNotMatched (class)

**Signature**

```ts
export declare class RouteNotMatched
```

Added in v1.0.0

## all

**Signature**

```ts
export declare const all: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R>
```

Added in v1.0.0

## catchAll

**Signature**

```ts
export declare const catchAll: {
  <E2, E3, R3>(
    onError: (error: E2) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(handler: HttpRouteHandler<R, E2, R2>) => HttpRouteHandler<R, E3, R2 | R3>
  <R extends Router.MatchInput.Any, E2, R2, E3, R3>(
    handler: HttpRouteHandler<R, E2, R2>,
    onError: (error: E2) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): HttpRouteHandler<R, E3, R2 | R3>
}
```

Added in v1.0.0

## catchAllCause

**Signature**

```ts
export declare const catchAllCause: {
  <E2, E3, R3>(
    onCause: (cause: Cause.Cause<E2>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(handler: HttpRouteHandler<R, E2, R2>) => HttpRouteHandler<R, E3, R2 | R3>
  <R extends Router.MatchInput.Any, E2, R2, E3, R3>(
    handler: HttpRouteHandler<R, E2, R2>,
    onCause: (cause: Cause.Cause<E2>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): HttpRouteHandler<R, E3, R2 | R3>
}
```

Added in v1.0.0

## catchTag

**Signature**

```ts
export declare const catchTag: {
  <E2, const Tag extends E2 extends { readonly _tag: string } ? E2["_tag"] : never, E3, R3>(
    tag: Tag,
    onError: (
      error: Extract<E2, { readonly _tag: Tag }>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(
    handler: HttpRouteHandler<R, E2, R2>
  ) => HttpRouteHandler<R, E3 | Exclude<E2, { readonly _tag: Tag }>, R2 | R3>
  <
    R extends Router.MatchInput.Any,
    E2,
    R2,
    const Tag extends E2 extends { readonly _tag: string } ? E2["_tag"] : never,
    E3,
    R3
  >(
    handler: HttpRouteHandler<R, E2, R2>,
    tag: Tag,
    onError: (
      error: Extract<E2, { readonly _tag: Tag }>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): HttpRouteHandler<R, E3 | Exclude<E2, { readonly _tag: Tag }>, R2 | R3>
}
```

Added in v1.0.0

## catchTags

**Signature**

```ts
export declare const catchTags: {
  <
    R extends Router.MatchInput.Any,
    E,
    Cases extends E extends { _tag: string }
      ? { [K in E["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => Handler<R, any, any>) | undefined }
      : Record<never, never>
  >(
    cases: Cases
  ): <R2>(
    handler: HttpRouteHandler<R, E, R2>
  ) => HttpRouteHandler<
    R,
    E | Effect.Effect.Error<Extract<Cases[keyof Cases], Handler<R, any, any>>>,
    R2 | Effect.Effect.Context<Extract<Cases[keyof Cases], Handler<R, any, any>>>
  >
  <
    R extends Router.MatchInput.Any,
    E,
    R2,
    Cases extends E extends { _tag: string }
      ? { [K in E["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => Handler<R, any, any>) | undefined }
      : Record<never, never>
  >(
    handler: HttpRouteHandler<R, E, R2>,
    cases: Cases
  ): HttpRouteHandler<
    R,
    E | Effect.Effect.Error<Extract<Cases[keyof Cases], Handler<R, any, any>>>,
    R2 | Effect.Effect.Context<Extract<Cases[keyof Cases], Handler<R, any, any>>>
  >
}
```

Added in v1.0.0

## currentParamsLayer

**Signature**

```ts
export declare function currentParamsLayer<I extends Router.MatchInput.Any>(
  params: CurrentParams<I>
): Layer.Layer<CurrentParams<I>>
```

Added in v1.0.0

## delete

**Signature**

```ts
export declare const delete: <I extends Router.MatchInput.Any, E, R>(route: I, handler: Handler<I, E, R>) => HttpRouteHandler<I, E, R>
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R>
```

Added in v1.0.0

## getCurrentParams

**Signature**

```ts
export declare function getCurrentParams<I extends Router.MatchInput.Any>(
  _route: I
): Effect.Effect<CurrentParams<I>, never, CurrentParams<I>>
```

Added in v1.0.0

## getCurrentParamsOption

**Signature**

```ts
export declare const getCurrentParamsOption: Effect.Effect<
  Option.Option<CurrentParams<Router.MatchInput.Any>>,
  never,
  never
>
```

Added in v1.0.0

## getUrlFromServerRequest

**Signature**

```ts
export declare function getUrlFromServerRequest(request: HttpServerRequest.HttpServerRequest): URL
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: (
  method: HttpMethod.HttpMethod | "*"
) => <I extends Router.MatchInput.Any, E, R>(route: I, handler: Handler<I, E, R>) => HttpRouteHandler<I, E, R>
```

Added in v1.0.0

## options

**Signature**

```ts
export declare const options: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R>
```

Added in v1.0.0

## patch

**Signature**

```ts
export declare const patch: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R>
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R>
```

Added in v1.0.0

## provide

**Signature**

```ts
export declare const provide: {
  <R3, E3, R4>(
    layer: Layer.Layer<R3, E3, R4>
  ): <R extends Router.MatchInput.Any, E2, R2>(
    handler: HttpRouteHandler<R, E2, R2>
  ) => HttpRouteHandler<
    R,
    E2 | E3,
    | R4
    | Exclude<HttpRouter.RouteContext, R3>
    | Exclude<HttpServerRequest.ParsedSearchParams, R3>
    | Exclude<Router.CurrentRoute, R3>
    | Exclude<Navigation.Navigation, R3>
    | Exclude<HttpServerRequest.HttpServerRequest, R3>
    | Exclude<R2, R3>
  >
  <R3>(
    context: Context.Context<R3> | Runtime.Runtime<R3>
  ): <R extends Router.MatchInput.Any, E2, R2>(
    handler: HttpRouteHandler<R, E2, R2>
  ) => HttpRouteHandler<
    R,
    E2,
    | Exclude<HttpRouter.RouteContext, R3>
    | Exclude<HttpServerRequest.ParsedSearchParams, R3>
    | Exclude<Router.CurrentRoute, R3>
    | Exclude<Navigation.Navigation, R3>
    | Exclude<HttpServerRequest.HttpServerRequest, R3>
    | Exclude<R2, R3>
  >
  <R extends Router.MatchInput.Any, E2, R2, R3, E3 = never, R4 = never>(
    handler: HttpRouteHandler<R, E2, R2>,
    layer: Layer.Layer<R3, E3, R4> | Runtime.Runtime<R3> | Context.Context<R3>
  ): HttpRouteHandler<
    R,
    E2 | E3,
    | R4
    | Exclude<HttpRouter.RouteContext, R3>
    | Exclude<HttpServerRequest.ParsedSearchParams, R3>
    | Exclude<Router.CurrentRoute, R3>
    | Exclude<Navigation.Navigation, R3>
    | Exclude<HttpServerRequest.HttpServerRequest, R3>
    | Exclude<R2, R3>
  >
}
```

Added in v1.0.0

## provideService

**Signature**

```ts
export declare const provideService: <R extends Router.MatchInput.Any, E2, R2, I, S>(
  handler: HttpRouteHandler<R, E2, R2>,
  tag: Context.Tag<I, S>,
  service: S
) => HttpRouteHandler<
  R,
  E2,
  | Exclude<HttpRouter.RouteContext, I>
  | Exclude<HttpServerRequest.ParsedSearchParams, I>
  | Exclude<Router.CurrentRoute, I>
  | Exclude<Navigation.Navigation, I>
  | Exclude<HttpServerRequest.HttpServerRequest, I>
  | Exclude<R2, I>
>
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R>
```

Added in v1.0.0

## toHttpApp

**Signature**

```ts
export declare function toHttpApp<I extends HttpRouteHandler.Any>(
  { handler, route: input }: I,
  parent?: Router.CurrentRoute
): HttpApp.Default<HttpRouteHandler.Error<I>, HttpRouteHandler.Context<I>>
```

Added in v1.0.0

## toPlatformRoute

**Signature**

```ts
export declare function toPlatformRoute<I extends HttpRouteHandler.Any>(
  handler: I
): <E, R>(
  self: HttpRouter.HttpRouter<E, R>
) => HttpRouter.HttpRouter<E | HttpRouteHandler.Error<I>, R | HttpRouteHandler.Context<I>>
```

Added in v1.0.0
