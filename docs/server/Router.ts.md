---
title: Router.ts
nav_order: 20
parent: "@typed/server"
---

## Router overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Mount (class)](#mount-class)
  - [Router (interface)](#router-interface)
  - [addHandler](#addhandler)
  - [all](#all)
  - [catchAll](#catchall)
  - [catchAllCause](#catchallcause)
  - [catchTag](#catchtag)
  - [delete](#delete)
  - [empty](#empty)
  - [fromPlatformRouter](#fromplatformrouter)
  - [get](#get)
  - [head](#head)
  - [mount](#mount)
  - [mountApp](#mountapp)
  - [options](#options)
  - [patch](#patch)
  - [post](#post)
  - [put](#put)
  - [toPlatformRouter](#toplatformrouter)

---

# utils

## Mount (class)

**Signature**

```ts
export declare class Mount<E, R> { constructor(
    readonly prefix: MatchInput.MatchInput.Any,
    readonly app: Default<E, R>,
    readonly options?: { readonly includePrefix?: boolean | undefined }
  ) }
```

Added in v1.0.0

## Router (interface)

**Signature**

```ts
export interface Router<E, R>
  extends Default<
    E | RouteNotFound,
    TypedRouter.CurrentRoute | Exclude<R, RouteHandler.CurrentParams<any> | Navigation.Navigation>
  > {
  readonly [RouterTypeId]: RouterTypeId
  readonly routes: Chunk.Chunk<RouteHandler.RouteHandler<MatchInput.MatchInput.Any, E, R>>
  readonly mounts: Chunk.Chunk<Mount<E, R>>
}
```

Added in v1.0.0

## addHandler

**Signature**

```ts
export declare const addHandler: {
  <I extends RouteHandler.RouteHandler.Any>(
    handler: I
  ): <E, R>(
    router: Router<E, R>
  ) => Router<E | RouteHandler.RouteHandler.Error<I>, R | RouteHandler.RouteHandler.Context<I>>
  <E, R, I extends RouteHandler.RouteHandler.Any>(
    router: Router<E, R>,
    handler: I
  ): Router<E | RouteHandler.RouteHandler.Error<I>, R | RouteHandler.RouteHandler.Context<I>>
}
```

Added in v1.0.0

## all

**Signature**

```ts
export declare const all: <I extends TypedRouter.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | TypedRouter.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<TypedRouter.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## catchAll

**Signature**

```ts
export declare const catchAll: {
  <E, E2, R2>(
    onCause: (cause: E) => Effect.Effect<ServerResponse, E2, R2>
  ): <R>(router: Router<E, R>) => Router<E2, R2 | R>
  <E, R, E2, R2>(router: Router<E, R>, onCause: (cause: E) => Effect.Effect<ServerResponse, E2, R2>): Router<E2, R | R2>
}
```

Added in v1.0.0

## catchAllCause

**Signature**

```ts
export declare const catchAllCause: {
  <E, E2, R2>(
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<ServerResponse, E2, R2>
  ): <R>(router: Router<E, R>) => Router<E2, R2 | R>
  <E, R, E2, R2>(
    router: Router<E, R>,
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<ServerResponse, E2, R2>
  ): Router<E2, R | R2>
}
```

Added in v1.0.0

## catchTag

**Signature**

```ts
export declare const catchTag: {
  <E, const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never, E2, R2>(
    tag: Tag,
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E2, R2>
  ): <R>(router: Router<E, R>) => Router<E2 | Exclude<E, { readonly _tag: Tag }>, R2 | R>
  <E, R, const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never, E2, R2>(
    router: Router<E, R>,
    tag: Tag,
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E2, R2>
  ): Router<E2 | Exclude<E, { readonly _tag: Tag }>, R | R2>
}
```

Added in v1.0.0

## delete

**Signature**

```ts
export declare const delete: <I extends TypedRouter.MatchInput.Any, E2, R2>(route: I, handler: RouteHandler.Handler<I, E2, R2>) => <E, R>(router: Router<E, R>) => Router<RouteHandler.RouteNotMatched | E2 | E | TypedRouter.MatchInput.Error<I>, R | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, Navigation.Navigation> | Exclude<TypedRouter.MatchInput.Context<I>, Navigation.Navigation>>
```

Added in v1.0.0

## empty

**Signature**

```ts
export declare const empty: Router<never, never>
```

Added in v1.0.0

## fromPlatformRouter

**Signature**

```ts
export declare const fromPlatformRouter: <E, R>(platformRouter: PlatformRouter.Router<E, R>) => Router<E, R>
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: <I extends TypedRouter.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | TypedRouter.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<TypedRouter.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: <I extends TypedRouter.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | TypedRouter.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<TypedRouter.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## mount

**Signature**

```ts
export declare const mount: {
  <Prefix extends string | TypedRouter.MatchInput.Any, E2, R2>(
    prefix: Prefix,
    router: Router<E2, R2>
  ): <E, R>(parentRouter: Router<E, R>) => Router<E2 | E, R2 | R>
  <E, R, Prefix extends string | TypedRouter.MatchInput.Any, E2, R2>(
    parentRouter: Router<E, R>,
    prefix: Prefix,
    router: Router<E2, R2>
  ): Router<E | E2, R | R2>
}
```

Added in v1.0.0

## mountApp

**Signature**

```ts
export declare const mountApp: {
  <Prefix extends string | TypedRouter.MatchInput.Any, E2, R2>(
    prefix: Prefix,
    app: Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): <E, R>(router: Router<E, R>) => Router<E2 | E, R2 | R>
  <E, R, Prefix extends string | TypedRouter.MatchInput.Any, E2, R2>(
    router: Router<E, R>,
    prefix: Prefix,
    app: Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): Router<E | E2, R | R2>
}
```

Added in v1.0.0

## options

**Signature**

```ts
export declare const options: <I extends TypedRouter.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | TypedRouter.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<TypedRouter.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## patch

**Signature**

```ts
export declare const patch: <I extends TypedRouter.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | TypedRouter.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<TypedRouter.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: <I extends TypedRouter.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | TypedRouter.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<TypedRouter.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: <I extends TypedRouter.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | TypedRouter.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<TypedRouter.MatchInput.Context<I>, Navigation.Navigation>
>
```

Added in v1.0.0

## toPlatformRouter

Note this will only function properly if your route's paths are compatible with the platform router.

**Signature**

```ts
export declare const toPlatformRouter: <E, R>(
  router: Router<E, R>
) => PlatformRouter.Router<RouteHandler.RouteNotMatched | E, TypedRouter.CurrentRoute | R>
```

Added in v1.0.0
