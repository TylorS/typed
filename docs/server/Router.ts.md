---
title: Router.ts
nav_order: 16
parent: "@typed/server"
---

## Router overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Mount (interface)](#mount-interface)
  - [Router (interface)](#router-interface)
  - [addHandler](#addhandler)
  - [all](#all)
  - [delete](#delete)
  - [empty](#empty)
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

## Mount (interface)

**Signature**

```ts
export interface Mount<E, R> {
  readonly prefix: MatchInput.MatchInput.Any
  readonly app: Default<E, R>
}
```

Added in v1.0.0

## Router (interface)

**Signature**

```ts
export interface Router<E, R>
  extends Default<E | RouteNotFound, Exclude<R, CurrentRoute | RouteHandler.CurrentParams<any> | Navigation>> {
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
export declare const all: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
>
```

Added in v1.0.0

## delete

**Signature**

```ts
export declare const delete: <I extends MatchInput.MatchInput.Any, E2, R2>(route: I, handler: RouteHandler.Handler<I, E2, R2>) => <E, R>(router: Router<E, R>) => Router<RouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>, R | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation> | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>>
```

Added in v1.0.0

## empty

**Signature**

```ts
export declare const empty: Router<never, never>
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
>
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
>
```

Added in v1.0.0

## mount

**Signature**

```ts
export declare const mount: {
  <Prefix extends MatchInput.MatchInput.Any, E2, R2>(
    prefix: Prefix,
    router: Router<E2, R2>
  ): <E, R>(parentRouter: Router<E, R>) => Router<E2 | E, R2 | R>
  <E, R, Prefix extends MatchInput.MatchInput.Any, E2, R2>(
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
  <Prefix extends MatchInput.MatchInput.Any, E2, R2>(
    prefix: Prefix,
    app: Default<E2, R2>
  ): <E, R>(router: Router<E, R>) => Router<E2 | E, R2 | R>
  <E, R, Prefix extends MatchInput.MatchInput.Any, E2, R2>(
    router: Router<E, R>,
    prefix: Prefix,
    app: Default<E2, R2>
  ): Router<E | E2, R | R2>
}
```

Added in v1.0.0

## options

**Signature**

```ts
export declare const options: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
>
```

Added in v1.0.0

## patch

**Signature**

```ts
export declare const patch: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
>
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
>
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
>
```

Added in v1.0.0

## toPlatformRouter

Note this will only function properly if your route's paths are compatible with the platform router.

**Signature**

```ts
export declare const toPlatformRouter: <E, R>(
  router: Router<E, R>
) => PlatformRouter.Router<RouteHandler.RouteNotMatched | E, R>
```

Added in v1.0.0
