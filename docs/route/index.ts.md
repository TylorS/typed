---
title: index.ts
nav_order: 1
parent: "@typed/route"
---

## index overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AnyOutput (type alias)](#anyoutput-type-alias)
  - [FromPathParams (interface)](#frompathparams-interface)
  - [Route (interface)](#route-interface)
  - [Route (namespace)](#route-namespace)
    - [ParamsOf (type alias)](#paramsof-type-alias)
    - [Path (type alias)](#path-type-alias)
  - [any](#any)
  - [asGuard](#asguard)
  - [filter](#filter)
  - [filterMap](#filtermap)
  - [fromPath](#frompath)
  - [map](#map)
  - [mapEffect](#mapeffect)
  - [tap](#tap)

---

# utils

## AnyOutput (type alias)

**Signature**

```ts
export type AnyOutput<Routes extends Readonly<Record<string, Route<any>>>> = [
  {
    [K in keyof Routes]: [{ readonly _tag: K } & Route.ParamsOf<Routes[K]>] extends [infer R]
      ? { readonly [K in keyof R]: R[K] }
      : never
  }[keyof Routes]
] extends [infer R]
  ? R
  : never
```

Added in v1.0.0

## FromPathParams (interface)

**Signature**

```ts
export interface FromPathParams {
  readonly make?: ptr.ParseOptions & ptr.TokensToFunctionOptions
  readonly match?: ptr.ParseOptions & ptr.TokensToRegexpOptions & ptr.RegexpToFunctionOptions
}
```

Added in v1.0.0

## Route (interface)

**Signature**

```ts
export interface Route<P extends string> extends Pipeable.Pipeable {
  readonly path: P

  readonly params: FromPathParams

  readonly match: (path: string) => Option.Option<Path.ParamsOf<P>>

  readonly make: <const Params extends Path.ParamsOf<P> = Path.ParamsOf<P>>(
    ...params: [keyof Params] extends [never] ? readonly [{}?] : readonly [Params]
  ) => Path.Interpolate<P, Params>

  readonly concat: <P2 extends string>(
    route: Route<P2>,
    params?: FromPathParams
  ) => Route<Path.PathJoin<readonly [P, P2]>>

  readonly asGuard: () => Guard.Guard<string, never, never, Path.ParamsOf<P>>
}
```

Added in v1.0.0

## Route (namespace)

Added in v1.0.0

### ParamsOf (type alias)

**Signature**

```ts
export type ParamsOf<T> = T extends Route<infer P> ? Path.ParamsOf<P> : never
```

Added in v1.0.0

### Path (type alias)

**Signature**

```ts
export type Path<T> = T extends Route<infer P> ? P : never
```

Added in v1.0.0

## any

**Signature**

```ts
export declare function any<Routes extends Readonly<Record<string, Route<any>>>>(
  routes: Routes
): Guard.Guard<string, never, never, AnyOutput<Routes>>
```

Added in v1.0.0

## asGuard

**Signature**

```ts
export declare function asGuard<P extends string>(route: Route<P>): Guard.Guard<string, never, never, Path.ParamsOf<P>>
```

Added in v1.0.0

## filter

**Signature**

```ts
export declare const filter: {
  <P extends string>(
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => boolean
  ): (
    route: Route<P>
  ) => Guard.Guard<
    string,
    never,
    never,
    {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }
  >
  <P extends string>(
    route: Route<P>,
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => boolean
  ): Guard.Guard<
    string,
    never,
    never,
    {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }
  >
}
```

Added in v1.0.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <P extends string, B>(
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => Option.Option<B>
  ): (route: Route<P>) => Guard.Guard<string, never, never, B>
  <P extends string, B>(
    route: Route<P>,
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => Option.Option<B>
  ): Guard.Guard<string, never, never, B>
}
```

Added in v1.0.0

## fromPath

**Signature**

```ts
export declare function fromPath<const P extends string>(path: P, params: FromPathParams = {}): Route<P>
```

Added in v1.0.0

## map

**Signature**

```ts
export declare const map: {
  <P extends string, B>(
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => B
  ): (route: Route<P>) => Guard.Guard<string, never, never, B>
  <P extends string, B>(
    route: Route<P>,
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => B
  ): Guard.Guard<string, never, never, B>
}
```

Added in v1.0.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <P extends string, R2, E2, B>(
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => Effect.Effect<R2, E2, B>
  ): (route: Route<P>) => Guard.Guard<string, R2, E2, B>
  <P extends string, R2, E2, B>(
    route: Route<P>,
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => Effect.Effect<R2, E2, B>
  ): Guard.Guard<string, R2, E2, B>
}
```

Added in v1.0.0

## tap

**Signature**

```ts
export declare const tap: {
  <P extends string, R2, E2, B>(
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => Effect.Effect<R2, E2, B>
  ): (
    route: Route<P>
  ) => Guard.Guard<
    string,
    R2,
    E2,
    {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }
  >
  <P extends string, R2, E2, B>(
    route: Route<P>,
    f: (params: {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }) => Effect.Effect<R2, E2, B>
  ): Guard.Guard<
    string,
    R2,
    E2,
    {
      readonly [K in keyof Path.PartsToParams<Path.PathToParts<P>, {}>]: Path.PartsToParams<Path.PathToParts<P>, {}>[K]
    }
  >
}
```

Added in v1.0.0
