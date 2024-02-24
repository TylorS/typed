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
  - [FromPathParams (interface)](#frompathparams-interface)
  - [Route (interface)](#route-interface)
  - [Route (namespace)](#route-namespace)
    - [ParamsOf (type alias)](#paramsof-type-alias)
    - [Path (type alias)](#path-type-alias)
  - [fromPath](#frompath)

---

# utils

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
export interface Route<P extends string> extends Pipeable.Pipeable, Guard.AsGuard<string, Path.ParamsOf<P>> {
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

## fromPath

**Signature**

```ts
export declare function fromPath<const P extends string>(path: P, params: FromPathParams = {}): Route<P>
```

Added in v1.0.0
