---
title: RouteHandler.ts
nav_order: 19
parent: "@typed/server"
---

## RouteHandler overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [CurrentParams (interface)](#currentparams-interface)
  - [Handler (type alias)](#handler-type-alias)
  - [RouteHandler (interface)](#routehandler-interface)
  - [RouteHandler (namespace)](#routehandler-namespace)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
  - [RouteNotMatched (class)](#routenotmatched-class)
  - [all](#all)
  - [catchAll](#catchall)
  - [catchAllCause](#catchallcause)
  - [catchTag](#catchtag)
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
  - [put](#put)
  - [toHttpApp](#tohttpapp)
  - [toPlatformRoute](#toplatformroute)

---

# utils

## CurrentParams (interface)

**Signature**

```ts
export interface CurrentParams<I extends Router.MatchInput.Any> {
  readonly params: Router.MatchInput.Success<I>
  readonly queryParams: URLSearchParams
}
```

Added in v1.0.0

## Handler (type alias)

**Signature**

```ts
export type Handler<Route extends Router.MatchInput.Any, E, R> = Effect.Effect<
  ServerResponse,
  E,
  R | Router.CurrentRoute | CurrentParams<Route> | Navigation.Navigation | ServerRequest
>
```

Added in v1.0.0

## RouteHandler (interface)

**Signature**

```ts
export interface RouteHandler<Route extends Router.MatchInput.Any, E, R> {
  readonly method: Method | "*"
  readonly route: Route
  readonly handler: Handler<Route, E, R>
}
```

Added in v1.0.0

## RouteHandler (namespace)

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any = RouteHandler<Router.MatchInput.Any, any, any>
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> =
  T extends RouteHandler<infer I, any, infer R>
    ? Exclude<Exclude<R, CurrentParams<I>> | Router.MatchInput.Context<I>, Navigation.Navigation>
    : never
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> =
  T extends RouteHandler<infer I, infer E, any> ? E | Router.MatchInput.Error<I> | RouteNotMatched : never
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
) => RouteHandler<I, E, R>
```

Added in v1.0.0

## catchAll

**Signature**

```ts
export declare const catchAll: {
  <E2, E3, R3>(
    onError: (error: E2) => Effect.Effect<ServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(handler: RouteHandler<R, E2, R2>) => RouteHandler<R, E3, R3 | R2>
  <R extends Router.MatchInput.Any, E2, R2, E3, R3>(
    handler: RouteHandler<R, E2, R2>,
    onError: (error: E2) => Effect.Effect<ServerResponse, E3, R3>
  ): RouteHandler<R, E3, R2 | R3>
}
```

Added in v1.0.0

## catchAllCause

**Signature**

```ts
export declare const catchAllCause: {
  <E2, E3, R3>(
    onCause: (cause: Cause.Cause<E2>) => Effect.Effect<ServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(handler: RouteHandler<R, E2, R2>) => RouteHandler<R, E3, R3 | R2>
  <R extends Router.MatchInput.Any, E2, R2, E3, R3>(
    handler: RouteHandler<R, E2, R2>,
    onCause: (cause: Cause.Cause<E2>) => Effect.Effect<ServerResponse, E3, R3>
  ): RouteHandler<R, E3, R2 | R3>
}
```

Added in v1.0.0

## catchTag

**Signature**

```ts
export declare const catchTag: {
  <E2, const Tag extends E2 extends { readonly _tag: string } ? E2["_tag"] : never, E3, R3>(
    tag: Tag,
    onError: (error: Extract<E2, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(
    handler: RouteHandler<R, E2, R2>
  ) => RouteHandler<R, E3 | Exclude<E2, { readonly _tag: Tag }>, R3 | R2>
  <
    R extends Router.MatchInput.Any,
    E2,
    R2,
    const Tag extends E2 extends { readonly _tag: string } ? E2["_tag"] : never,
    E3,
    R3
  >(
    handler: RouteHandler<R, E2, R2>,
    tag: Tag,
    onError: (error: Extract<E2, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E3, R3>
  ): RouteHandler<R, E3 | Exclude<E2, { readonly _tag: Tag }>, R2 | R3>
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
export declare const delete: <I extends Router.MatchInput.Any, E, R>(route: I, handler: Handler<I, E, R>) => RouteHandler<I, E, R>
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R>
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
export declare function getUrlFromServerRequest(request: ServerRequest): URL
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: (
  method: Method | "*"
) => <I extends Router.MatchInput.Any, E, R>(route: I, handler: Handler<I, E, R>) => RouteHandler<I, E, R>
```

Added in v1.0.0

## options

**Signature**

```ts
export declare const options: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R>
```

Added in v1.0.0

## patch

**Signature**

```ts
export declare const patch: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R>
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R>
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R>
```

Added in v1.0.0

## toHttpApp

**Signature**

```ts
export declare function toHttpApp<I extends RouteHandler.Any>(
  { handler, route: input }: I,
  parent?: Router.CurrentRoute
): Default<RouteHandler.Error<I>, RouteHandler.Context<I>>
```

Added in v1.0.0

## toPlatformRoute

**Signature**

```ts
export declare function toPlatformRoute<I extends RouteHandler.Any>(
  handler: I
): <E, R>(
  self: PlatformRouter.Router<E, R>
) => PlatformRouter.Router<E | RouteHandler.Error<I>, R | RouteHandler.Context<I>>
```

Added in v1.0.0
