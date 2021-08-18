---
title: Route.ts
nav_order: 61
parent: Modules
---

## Route overview

This DSL represents all of the standard syntax for path-to-regexp (e.g. used in express.js and many
other libs) but does not cover the fancier regex validations that are techincally possible.

Added in v0.13.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [map](#map)
  - [oneOf](#oneof)
- [Constructor](#constructor)
  - [make](#make)
- [Model](#model)
  - [Route (interface)](#route-interface)
- [Type-level](#type-level)
  - [OneOf (type alias)](#oneof-type-alias)
  - [PathOf (type alias)](#pathof-type-alias)
  - [ValueOf (type alias)](#valueof-type-alias)

---

# Combinator

## map

**Signature**

```ts
export declare function map<A, B>(f: (value: A) => B)
```

Added in v0.13.0

## oneOf

**Signature**

```ts
export declare function oneOf<Routes extends readonly [Route<string>, ...Route<string>[]]>(
  ...[first, ...rest]: Routes
): ReaderOption<string, OneOf<Routes>>
```

Added in v0.13.0

# Constructor

## make

**Signature**

```ts
export declare function make<P extends string>(path: P): Route<P>
```

Added in v0.13.0

# Model

## Route (interface)

**Signature**

```ts
export interface Route<P extends string, A = ParamsOf<P>> {
  readonly path: P
  readonly match: ReaderOption<string, A>
  readonly createPath: <I extends ParamsOf<P>>(params: I) => Interpolate<P, I>
}
```

Added in v0.13.0

# Type-level

## OneOf (type alias)

**Signature**

```ts
export type OneOf<Routes extends readonly [Route<string>, ...Route<string>[]]> = ValueOf<
  Routes[number]
>
```

Added in v0.13.0

## PathOf (type alias)

**Signature**

```ts
export type PathOf<A> = [A] extends [Route<infer R>] ? R : never
```

Added in v0.13.0

## ValueOf (type alias)

**Signature**

```ts
export type ValueOf<A> = [A] extends [Route<infer R>] ? ParamsOf<R> : never
```

Added in v0.13.0
