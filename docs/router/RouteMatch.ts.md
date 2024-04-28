---
title: RouteMatch.ts
nav_order: 6
parent: "@typed/router"
---

## RouteMatch overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [RouteMatch (interface)](#routematch-interface)
  - [RouteMatch (namespace)](#routematch-namespace)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [fromInput](#frominput)
  - [fromRoute](#fromroute)
  - [make](#make)

---

# utils

## RouteMatch (interface)

**Signature**

```ts
export interface RouteMatch<R extends Route.Route.Any, B, E2, R2, C, E3, R3>
  extends RouteGuard.RouteGuard<R, B, E2, R2> {
  readonly match: (ref: RefSubject<B>) => Fx<C, E3, R3>
}
```

Added in v1.0.0

## RouteMatch (namespace)

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any = RouteMatch<Route.Route.Any, any, any, any, any, any, any>
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> =
  T extends RouteMatch<infer _R, infer _B, infer _E2, infer _R2, infer _C, infer _E3, infer _R3> ? _R2 | _R3 : never
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> =
  T extends RouteMatch<infer _R, infer _B, infer E2, infer _R2, infer _C, infer E3, infer _R3> ? E2 | E3 : never
```

Added in v1.0.0

### Success (type alias)

**Signature**

```ts
export type Success<T> =
  T extends RouteMatch<infer _R, infer _B, infer _E2, infer _R2, infer C, infer _E3, infer _R3> ? C : never
```

Added in v1.0.0

## fromInput

**Signature**

```ts
export declare function fromInput<I extends MatchInput.Any, A, E, R>(
  input: I,
  match: (ref: RefSubject<MatchInput.Success<I>>) => Fx<A, E, R>
): RouteMatch<
  MatchInput.Route<I>,
  MatchInput.Success<I>,
  MatchInput.Error<I>,
  MatchInput.Context<I>,
  A,
  E,
  Exclude<R, CurrentRoute>
>
```

Added in v1.0.0

## fromRoute

**Signature**

```ts
export declare function fromRoute<R extends Route.Route.Any, C, E3, R3>(
  route: R,
  match: (ref: RefSubject<Route.Route.Type<R>>) => Fx<C, E3, R3>
): RouteMatch<
  R,
  Route.Route.Type<R>,
  Route.RouteDecodeError<R>,
  Route.Route.Context<R>,
  C,
  E3,
  Exclude<R3, CurrentRoute>
>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<R extends Route.Route.Any, B, E2, R2, C, E3, R3>(
  route: R,
  guard: Guard<string, B, E2, R2>,
  match: (ref: RefSubject<B>) => Fx<C, E3, R3>
): RouteMatch<R, B, E2, R2, C, E3, Exclude<R3, CurrentRoute>>
```

Added in v1.0.0
