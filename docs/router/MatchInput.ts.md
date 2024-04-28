---
title: MatchInput.ts
nav_order: 4
parent: "@typed/router"
---

## MatchInput overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [MatchInput (type alias)](#matchinput-type-alias)
  - [MatchInput (namespace)](#matchinput-namespace)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [HasParams (type alias)](#hasparams-type-alias)
    - [ParamsOf (type alias)](#paramsof-type-alias)
    - [Path (type alias)](#path-type-alias)
    - [Route (type alias)](#route-type-alias)
    - [Schema (type alias)](#schema-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [asRouteGuard](#asrouteguard)
  - [concat](#concat)
  - [filter](#filter)
  - [filterMap](#filtermap)
  - [flatMap](#flatmap)
  - [getPath](#getpath)
  - [getRoute](#getroute)
  - [getSchema](#getschema)
  - [map](#map)
  - [mapEffect](#mapeffect)

---

# utils

## MatchInput (type alias)

**Signature**

```ts
export type MatchInput<P extends string, S extends Schema.Schema.All, A = never, E = never, R = never> =
  | Route.Route<P, S>
  | RouteGuard.RouteGuard<Route.Route<P, S>, A, E, R>
```

Added in v1.0.0

## MatchInput (namespace)

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any = MatchInput<any, any, any, any, any> | MatchInput<any, never, any, any, any>
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> =
  T extends Route.Route<infer _P, infer _S>
    ? Route.Route.Context<T>
    : T extends RouteGuard.RouteGuard<Route.Route<infer _P, infer _S>, infer _A, infer _E, infer R>
      ? R
      : never
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> =
  T extends Route.Route<infer _P, infer _S>
    ? Route.RouteDecodeError<T>
    : T extends RouteGuard.RouteGuard<Route.Route<infer _P, infer _S>, infer _A, infer E, infer _R>
      ? E
      : never
```

Added in v1.0.0

### HasParams (type alias)

**Signature**

```ts
export type HasParams<T> = Route<T> extends Route.Route<infer P, infer _> ? _Path.HasParams<P> : false
```

Added in v1.0.0

### ParamsOf (type alias)

**Signature**

```ts
export type ParamsOf<T> = Route.Route.Params<Route<T>>
```

Added in v1.0.0

### Path (type alias)

**Signature**

```ts
export type Path<T> = Route.Route.Path<Route<T>>
```

Added in v1.0.0

### Route (type alias)

**Signature**

```ts
export type Route<T> =
  T extends Route.Route<infer P, infer S>
    ? Route.Route<P, S>
    : T extends RouteGuard.RouteGuard<Route.Route<infer P, infer S>, infer _A, infer _E, infer _R>
      ? Route.Route<P, S>
      : never
```

Added in v1.0.0

### Schema (type alias)

**Signature**

```ts
export type Schema<T> = Route.Route.Schema<MatchInput.Route<T>>
```

Added in v1.0.0

### Success (type alias)

**Signature**

```ts
export type Success<T> =
  T extends Route.Route<infer _P, infer _S>
    ? Route.Route.Type<T>
    : T extends RouteGuard.RouteGuard<Route.Route<infer _P, infer _S>, infer A, infer _E, infer _R>
      ? A
      : never
```

Added in v1.0.0

## asRouteGuard

**Signature**

```ts
export declare function asRouteGuard<I extends MatchInput.Any>(
  input: I
): RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>
```

Added in v1.0.0

## concat

**Signature**

```ts
export declare function concat<L extends MatchInput.Any, R extends MatchInput.Any>(
  left: L,
  right: R
): RouteGuard.RouteGuard<
  Route.Route.Concat<MatchInput.Route<L>, MatchInput.Route<R>>,
  MatchInput.Success<L> & MatchInput.Success<R>,
  MatchInput.Error<L> | MatchInput.Error<R>,
  MatchInput.Context<L> | MatchInput.Context<R>
>
```

Added in v1.0.0

## filter

**Signature**

```ts
export declare const filter: {
  <I extends MatchInput.Any>(
    f: (a: MatchInput.Success<I>) => boolean
  ): (
    input: I
  ) => RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>
  <I extends MatchInput.Any>(
    input: I,
    f: (a: MatchInput.Success<I>) => boolean
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>
}
```

Added in v1.0.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <I extends MatchInput.Any, A>(
    f: (a: MatchInput.Success<I>) => Option.Option<A>
  ): (input: I) => RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>>
  <I extends MatchInput.Any, A>(
    input: I,
    f: (a: MatchInput.Success<I>) => Option.Option<A>
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>>
}
```

Added in v1.0.0

## flatMap

**Signature**

```ts
export declare const flatMap: {
  <I extends MatchInput.Any, A, E2, R2>(
    guard: Guard<MatchInput.Success<I>, A, E2, R2>
  ): (input: I) => RouteGuard.RouteGuard<MatchInput.Route<I>, A, E2 | MatchInput.Error<I>, R2 | MatchInput.Context<I>>
  <I extends MatchInput.Any, A, E2, R2>(
    input: I,
    guard: Guard<MatchInput.Success<I>, A, E2, R2>
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, A, E2 | MatchInput.Error<I>, R2 | MatchInput.Context<I>>
}
```

Added in v1.0.0

## getPath

**Signature**

```ts
export declare function getPath<I extends MatchInput.Any>(input: I): MatchInput.Path<I>
```

Added in v1.0.0

## getRoute

**Signature**

```ts
export declare function getRoute<I extends MatchInput.Any>(input: I): MatchInput.Route<I>
```

Added in v1.0.0

## getSchema

**Signature**

```ts
export declare function getSchema<I extends MatchInput.Any>(input: I): MatchInput.Schema<I>
```

Added in v1.0.0

## map

**Signature**

```ts
export declare const map: {
  <I extends MatchInput.Any, A>(
    f: (a: MatchInput.Success<I>) => A
  ): (input: I) => RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>>
  <I extends MatchInput.Any, A>(
    input: I,
    f: (a: MatchInput.Success<I>) => A
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>>
}
```

Added in v1.0.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <I extends MatchInput.Any, A, E2, R2>(
    f: (a: MatchInput.Success<I>) => Effect.Effect<A, E2, R2>
  ): (input: I) => RouteGuard.RouteGuard<MatchInput.Route<I>, A, E2 | MatchInput.Error<I>, R2 | MatchInput.Context<I>>
  <I extends MatchInput.Any, A, E2, R2>(
    input: I,
    f: (a: MatchInput.Success<I>) => Effect.Effect<A, E2, R2>
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, A, E2 | MatchInput.Error<I>, R2 | MatchInput.Context<I>>
}
```

Added in v1.0.0
