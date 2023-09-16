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
  - [MakeRoute (type alias)](#makeroute-type-alias)
  - [ParamsOf (type alias)](#paramsof-type-alias)
  - [PathOf (type alias)](#pathof-type-alias)
  - [Route](#route)
  - [Route (interface)](#route-interface)
  - [Route (namespace)](#route-namespace)
  - [RouteOptions (interface)](#routeoptions-interface)

---

# utils

## MakeRoute (type alias)

Create a Route from a path and optional options

**Signature**

```ts
export type MakeRoute<P extends string> = <const Params extends Path.ParamsOf<P>>(
  params: Params
) => Path.Interpolate<P, Params>
```

Added in v1.0.0

## ParamsOf (type alias)

Get the params of a Route

**Signature**

```ts
export type ParamsOf<T extends Route<any>> = [T] extends [Route<infer P>] ? Path.ParamsOf<P> : never
```

Added in v1.0.0

## PathOf (type alias)

Get the path of a Route

**Signature**

```ts
export type PathOf<T extends Route<any>> = [T] extends [Route<infer P>] ? P : never
```

Added in v1.0.0

## Route

Create a Route from a path and optional options to path-to-regexp

**Signature**

```ts
export declare function Route<const P extends string>(path: P, options?: RouteOptions): Route<P>
```

Added in v1.0.0

## Route (interface)

A Route is a data structure for creating and matching
paths based on path-to-regexp.

**Signature**

```ts
export interface Route<in out P extends string> {
  /**
   * The underlying path of the route
   * @since 1.0.0
   */
  readonly path: P

  /**
   * The options used to create the route
   * @since 1.0.0
   */
  readonly options?: RouteOptions

  /**
   * Create a path from a given set params
   * @since 1.0.0
   */
  readonly make: MakeRoute<P>

  /**
   * Match a path against this route
   * @since 1.0.0
   */
  readonly match: (path: string) => Option.Option<Path.ParamsOf<P>>

  /**
   * Concatenate this route with another route
   * @since 1.0.0
   */
  readonly concat: <const P2 extends string>(
    route: Route<P2>,
    options?: RouteOptions
  ) => Route<Path.PathJoin<readonly [P, P2]>>
}
```

Added in v1.0.0

## Route (namespace)

Added in v1.0.0

## RouteOptions (interface)

Options for creating and matching a route with path-to-regexp

**Signature**

```ts
export interface RouteOptions {
  readonly make?: ptr.ParseOptions & ptr.TokensToFunctionOptions
  readonly match?: ptr.ParseOptions & ptr.TokensToRegexpOptions & ptr.RegexpToFunctionOptions
}
```

Added in v1.0.0
