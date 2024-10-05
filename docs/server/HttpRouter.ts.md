---
title: HttpRouter.ts
nav_order: 17
parent: "@typed/server"
---

## HttpRouter overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [HttpRouter (interface)](#httprouter-interface)
  - [HttpRouter (namespace)](#httprouter-namespace)
    - [Service (interface)](#service-interface)
    - [TagClass (interface)](#tagclass-interface)
    - [DefaultServices (type alias)](#defaultservices-type-alias)
    - [ExcludeProvided (type alias)](#excludeprovided-type-alias)
    - [Provided (type alias)](#provided-type-alias)
  - [Mount (class)](#mount-class)
  - [Tag](#tag)
  - [addHandler](#addhandler)
  - [all](#all)
  - [append](#append)
  - [catchAll](#catchall)
  - [catchAllCause](#catchallcause)
  - [catchTag](#catchtag)
  - [catchTags](#catchtags)
  - [concat](#concat)
  - [delete](#delete)
  - [empty](#empty)
  - [fromIterable](#fromiterable)
  - [fromPlatformRouter](#fromplatformrouter)
  - [get](#get)
  - [head](#head)
  - [mount](#mount)
  - [mountApp](#mountapp)
  - [options](#options)
  - [patch](#patch)
  - [post](#post)
  - [prepend](#prepend)
  - [put](#put)
  - [toPlatformRouter](#toplatformrouter)

---

# utils

## HttpRouter (interface)

**Signature**

```ts
export interface HttpRouter<E, R>
  extends HttpApp.Default<
    E | HttpServerError.HttpServerError,
    TypedRouter.CurrentRoute | Exclude<R, HttpRouteHandler.CurrentParams<any> | Navigation.Navigation>
  > {
  readonly [RouterTypeId]: RouterTypeId
  readonly routes: Chunk.Chunk<HttpRouteHandler.HttpRouteHandler<MatchInput.MatchInput.Any, E, R>>
  readonly mounts: Chunk.Chunk<Mount<E, R>>
}
```

Added in v1.0.0

## HttpRouter (namespace)

Added in v1.0.0

### Service (interface)

**Signature**

```ts
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
```

Added in v1.0.0

### TagClass (interface)

**Signature**

```ts
export interface TagClass<Self, Name extends string, E, R> extends Context.TagClass<Self, Name, Service<E, R>> {
  readonly Live: Layer.Layer<Self>
  readonly router: Effect.Effect<HttpRouter<E, R>, never, Self>
  readonly use: <XA, XE, XR>(f: (router: Service<E, R>) => Effect.Effect<XA, XE, XR>) => Layer.Layer<never, XE, XR>
  readonly useScoped: <XA, XE, XR>(
    f: (router: Service<E, R>) => Effect.Effect<XA, XE, XR>
  ) => Layer.Layer<never, XE, Exclude<XR, Scope.Scope>>
  readonly unwrap: <XA, XE, XR>(f: (router: HttpRouter<E, R>) => Layer.Layer<XA, XE, XR>) => Layer.Layer<XA, XE, XR>
}
```

Added in v1.0.0

### DefaultServices (type alias)

**Signature**

```ts
export type DefaultServices = TypedRouter.CurrentRoute
```

Added in v1.0.0

### ExcludeProvided (type alias)

**Signature**

```ts
export type ExcludeProvided<R> = Exclude<R, HttpRouteHandler.CurrentParams<any> | Navigation.Navigation>
```

Added in v1.0.0

### Provided (type alias)

**Signature**

```ts
export type Provided = HttpRouteHandler.CurrentParams<any> | Navigation.Navigation
```

Added in v1.0.0

## Mount (class)

**Signature**

```ts
export declare class Mount<E, R> { constructor(
    readonly prefix: MatchInput.MatchInput.Any,
    readonly app: HttpApp.Default<E, R>,
    readonly options?: { readonly includePrefix?: boolean | undefined }
  ) }
```

Added in v1.0.0

## Tag

**Signature**

```ts
export declare const Tag: <const Name extends string>(
  id: Name
) => <Self, R = never, E = unknown>() => HttpRouter.TagClass<Self, Name, E, R | HttpRouter.DefaultServices>
```

Added in v1.0.0

## addHandler

**Signature**

```ts
export declare const addHandler: {
  <I extends HttpRouteHandler.HttpRouteHandler.Any>(
    handler: I
  ): <E, R>(
    router: HttpRouter<E, R>
  ) => HttpRouter<E | HttpRouteHandler.HttpRouteHandler.Error<I>, R | HttpRouteHandler.HttpRouteHandler.Context<I>>
  <E, R, I extends HttpRouteHandler.HttpRouteHandler.Any>(
    router: HttpRouter<E, R>,
    handler: I
  ): HttpRouter<E | HttpRouteHandler.HttpRouteHandler.Error<I>, R | HttpRouteHandler.HttpRouteHandler.Context<I>>
}
```

Added in v1.0.0

## all

**Signature**

```ts
export declare const all: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## append

**Signature**

```ts
export declare const append: {
  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ): (router: HttpRouter<E, R>) => HttpRouter<E | E2, R | R3>
  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    router: HttpRouter<E, R>,
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ): HttpRouter<E | E2, R | R3>
}
```

Added in v1.0.0

## catchAll

**Signature**

```ts
export declare const catchAll: {
  <E, E2, R2>(
    onCause: (cause: E) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): <R>(router: HttpRouter<E, R>) => HttpRouter<E2, R | R2>
  <E, R, E2, R2>(
    router: HttpRouter<E, R>,
    onCause: (cause: E) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2, R | R2>
}
```

Added in v1.0.0

## catchAllCause

**Signature**

```ts
export declare const catchAllCause: {
  <E, E2, R2>(
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): <R>(router: HttpRouter<E, R>) => HttpRouter<E2, R | R2>
  <E, R, E2, R2>(
    router: HttpRouter<E, R>,
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2, R | R2>
}
```

Added in v1.0.0

## catchTag

**Signature**

```ts
export declare const catchTag: {
  <E, const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never, E2, R2>(
    tag: Tag,
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): <R>(router: HttpRouter<E, R>) => HttpRouter<E2 | Exclude<E, { readonly _tag: Tag }>, R | R2>
  <E, R, const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never, E2, R2>(
    router: HttpRouter<E, R>,
    tag: Tag,
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2 | Exclude<E, { readonly _tag: Tag }>, R | R2>
}
```

Added in v1.0.0

## catchTags

**Signature**

```ts
export declare const catchTags: {
  <
    E,
    Cases extends E extends { _tag: string }
      ? {
          [K in E["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => HttpRouteHandler.Handler<any, any, any>) | undefined
        }
      : {}
  >(
    cases: Cases
  ): <R>(
    self: HttpRouter<E, R>
  ) => HttpRouter<
    | Exclude<E, { _tag: keyof Cases }>
    | {
        [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never
      }[keyof Cases],
    | R
    | HttpRouter.ExcludeProvided<
        {
          [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never
        }[keyof Cases]
      >
  >
  <
    R,
    E,
    Cases extends E extends { _tag: string }
      ? {
          [K in E["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => HttpRouteHandler.Handler<any, any, any>) | undefined
        }
      : {}
  >(
    self: HttpRouter<E, R>,
    cases: Cases
  ): HttpRouter<
    | Exclude<E, { _tag: keyof Cases }>
    | {
        [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never
      }[keyof Cases],
    | R
    | HttpRouter.ExcludeProvided<
        {
          [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never
        }[keyof Cases]
      >
  >
}
```

Added in v1.0.0

## concat

**Signature**

```ts
export declare const concat: {
  <E2, R2>(router2: HttpRouter<E2, R2>): <E, R>(router: HttpRouter<E, R>) => HttpRouter<E | E2, R | R2>
  <E, R, E2, R2>(router: HttpRouter<E, R>, router2: HttpRouter<E2, R2>): HttpRouter<E | E2, R | R2>
}
```

Added in v1.0.0

## delete

**Signature**

```ts
export declare const delete: <I extends MatchInput.MatchInput.Any, E2, R2>(route: I, handler: HttpRouteHandler.Handler<I, E2, R2>) => <E, R>(router: HttpRouter<E, R>) => HttpRouter<E | E2 | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>, R | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation> | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>>
```

Added in v1.0.0

## empty

**Signature**

```ts
export declare const empty: HttpRouter<never, never>
```

Added in v1.0.0

## fromIterable

**Signature**

```ts
export declare function fromIterable<E, R>(
  handlers: Iterable<HttpRouteHandler.HttpRouteHandler<any, E, R>>
): HttpRouter<E, R>
```

Added in v1.0.0

## fromPlatformRouter

**Signature**

```ts
export declare const fromPlatformRouter: <E, R>(platformRouter: PlatformHttpRouter.HttpRouter<E, R>) => HttpRouter<E, R>
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## mount

**Signature**

```ts
export declare const mount: {
  <Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    prefix: Prefix,
    router: HttpRouter<E2, R2>
  ): <E, R>(parentRouter: HttpRouter<E, R>) => HttpRouter<E | E2, R | R2>
  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    parentRouter: HttpRouter<E, R>,
    prefix: Prefix,
    router: HttpRouter<E2, R2>
  ): HttpRouter<E | E2, R | R2>
}
```

Added in v1.0.0

## mountApp

**Signature**

```ts
export declare const mountApp: {
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
}
```

Added in v1.0.0

## options

**Signature**

```ts
export declare const options: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## patch

**Signature**

```ts
export declare const patch: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  HttpRouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## prepend

**Signature**

```ts
export declare const prepend: {
  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ): (router: HttpRouter<E, R>) => HttpRouter<E | E2, R | R3>
  <E, R, R2 extends TypedRouter.MatchInput.Any, E2, R3>(
    router: HttpRouter<E, R>,
    handler: HttpRouteHandler.HttpRouteHandler<R2, E2, R3>
  ): HttpRouter<E | E2, R | R3>
}
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## toPlatformRouter

Note this will only function properly if your route's paths are compatible with the platform router.

**Signature**

```ts
export declare const toPlatformRouter: <E, R>(
  router: HttpRouter<E, R>
) => PlatformHttpRouter.HttpRouter<
  E | HttpServerError.RouteNotFound | HttpRouteHandler.RouteNotMatched,
  TypedRouter.CurrentRoute | R
>
```

Added in v1.0.0
