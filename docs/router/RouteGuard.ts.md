---
title: RouteGuard.ts
nav_order: 5
parent: "@typed/router"
---

## RouteGuard overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [RouteGuard (interface)](#routeguard-interface)
  - [RouteGuard (namespace)](#routeguard-namespace)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Route (type alias)](#route-type-alias)
    - [Success (type alias)](#success-type-alias)
    - [UpdateSuccess (type alias)](#updatesuccess-type-alias)
  - [concat](#concat)
  - [filter](#filter)
  - [filterMap](#filtermap)
  - [flatMap](#flatmap)
  - [fromRoute](#fromroute)
  - [make](#make)
  - [map](#map)
  - [mapEffect](#mapeffect)

---

# utils

## RouteGuard (interface)

**Signature**

```ts
export interface RouteGuard<R extends Route.Route.Any, B, E2, R2> {
  readonly route: R
  readonly guard: Guard.Guard<string, B, E2, R2>
}
```

Added in v1.0.0

## RouteGuard (namespace)

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any = RouteGuard<Route.Route.Any, any, any, any>
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends RouteGuard<infer _R, infer _B, infer _E2, infer R2> ? R2 : never
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = T extends RouteGuard<infer _R, infer _B, infer E2, infer _R2> ? E2 : never
```

Added in v1.0.0

### Route (type alias)

**Signature**

```ts
export type Route<T> = T extends RouteGuard<infer _R, infer _B, infer _E2, infer _R2> ? T["route"] : never
```

Added in v1.0.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = T extends RouteGuard<infer _R, infer B, infer _E2, infer _R2> ? B : never
```

Added in v1.0.0

### UpdateSuccess (type alias)

**Signature**

```ts
export type UpdateSuccess<R extends RouteGuard.Any, B> = RouteGuard<
  Route<R>,
  B,
  Route.RouteDecodeError<R["route"]>,
  Route.Route.Context<Route<R>>
>
```

Added in v1.0.0

## concat

**Signature**

```ts
export declare const concat: {
  <R extends RouteGuard.Any>(
    other: R
  ): <L extends RouteGuard.Any>(
    self: L
  ) => RouteGuard<
    Route.Route.Concat<RouteGuard.Route<L>, RouteGuard.Route<R>>,
    RouteGuard.Success<L> & RouteGuard.Success<R>,
    RouteGuard.Error<L> | RouteGuard.Error<R>,
    RouteGuard.Context<L> | RouteGuard.Context<R>
  >
  <L extends RouteGuard.Any, R extends RouteGuard.Any>(
    self: L,
    other: R
  ): RouteGuard<
    Route.Route.Concat<RouteGuard.Route<L>, RouteGuard.Route<R>>,
    RouteGuard.Success<L> & RouteGuard.Success<R>,
    RouteGuard.Error<L> | RouteGuard.Error<R>,
    RouteGuard.Context<L> | RouteGuard.Context<R>
  >
}
```

Added in v1.0.0

## filter

**Signature**

```ts
export declare const filter: {
  <R extends RouteGuard.Any>(f: (b: NoInfer<RouteGuard.Success<R>>) => boolean): (self: R) => R
  <R extends RouteGuard.Any>(self: R, f: (b: NoInfer<RouteGuard.Success<R>>) => boolean): R
}
```

Added in v1.0.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <R extends RouteGuard.Any, C>(
    f: (b: NoInfer<RouteGuard.Success<R>>) => Option.Option<C>
  ): (self: R) => RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>>
  <R extends RouteGuard.Any, C>(
    self: R,
    f: (b: NoInfer<RouteGuard.Success<R>>) => Option.Option<C>
  ): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>>
}
```

Added in v1.0.0

## flatMap

**Signature**

```ts
export declare const flatMap: {
  <R extends RouteGuard.Any, C, E3, R3>(
    guard: Guard.Guard<RouteGuard.Success<R>, C, E3, R3>
  ): (self: R) => RouteGuard<RouteGuard.Route<R>, C, E3 | RouteGuard.Error<R>, R3 | RouteGuard.Context<R>>
  <R extends RouteGuard.Any, C, E3, R3>(
    self: R,
    guard: Guard.Guard<RouteGuard.Success<R>, C, E3, R3>
  ): RouteGuard<RouteGuard.Route<R>, C, E3 | RouteGuard.Error<R>, R3 | RouteGuard.Context<R>>
}
```

Added in v1.0.0

## fromRoute

**Signature**

```ts
export declare function fromRoute<R extends Route.Route.Any>(
  route: R
): RouteGuard<R, Route.Route.Type<R>, Route.RouteDecodeError<R>, Route.Route.Context<R>>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<R extends Route.Route.Any, B, E2, R2>(
  route: R,
  guard: Guard.Guard<string, B, E2, R2>
): RouteGuard<R, B, E2, R2>
```

Added in v1.0.0

## map

**Signature**

```ts
export declare const map: {
  <R extends RouteGuard.Any, C>(
    f: (b: NoInfer<RouteGuard.Success<R>>) => C
  ): (self: R) => RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>>
  <R extends RouteGuard.Any, C>(
    self: R,
    f: (b: NoInfer<RouteGuard.Success<R>>) => C
  ): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>>
}
```

Added in v1.0.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <R extends RouteGuard.Any, C, E3, R3>(
    f: (b: NoInfer<RouteGuard.Success<R>>) => Effect.Effect<C, E3, R3>
  ): (self: R) => RouteGuard<RouteGuard.Route<R>, C, E3 | RouteGuard.Error<R>, R3 | RouteGuard.Context<R>>
  <R extends RouteGuard.Any, C, E3, R3>(
    self: R,
    f: (b: NoInfer<RouteGuard.Success<R>>) => Effect.Effect<C, E3, R3>
  ): RouteGuard<RouteGuard.Route<R>, C, E3 | RouteGuard.Error<R>, R3 | RouteGuard.Context<R>>
}
```

Added in v1.0.0
