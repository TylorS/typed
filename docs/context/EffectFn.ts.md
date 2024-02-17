---
title: EffectFn.ts
nav_order: 5
parent: "@typed/context"
---

## EffectFn overview

EffectFn is a type-alias for a function that returns an Effect.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [models](#models)
  - [EffectFn (interface)](#effectfn-interface)
- [utils](#utils)
  - [EffectFn (namespace)](#effectfn-namespace)
    - [ArgsOf (type alias)](#argsof-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Extendable (type alias)](#extendable-type-alias)
    - [Success (type alias)](#success-type-alias)

---

# models

## EffectFn (interface)

EffectFn is a type-alias for a function that returns an Effect.

**Signature**

```ts
export interface EffectFn<Args extends ReadonlyArray<any> = ReadonlyArray<any>, A = any, E = any, R = any> {
  (...args: Args): Effect.Effect<A, E, R>
}
```

Added in v1.0.0

# utils

## EffectFn (namespace)

Added in v1.0.0

### ArgsOf (type alias)

A helper for extracting the arguments of an EffectFn.

**Signature**

```ts
export type ArgsOf<T extends EffectFn> = T extends (
  ...args: infer Args
) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
Effect.Effect<infer _A, infer _E, infer _R>
  ? Args
  : never
```

Added in v1.0.0

### Context (type alias)

A helper for extracting the context of an EffectFn.

**Signature**

```ts
export type Context<T extends EffectFn> = T extends (
  ...args: infer _Args
) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
Effect.Effect<infer _A, infer _E, infer R>
  ? R
  : never
```

Added in v1.0.0

### Error (type alias)

A helper for extracting the error of an EffectFn.

**Signature**

```ts
export type Error<T extends EffectFn> = T extends (
  ...args: infer _Args
) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
Effect.Effect<infer _A, infer E, infer _R>
  ? E
  : never
```

Added in v1.0.0

### Extendable (type alias)

A helper for utilizing an EffectFn in an `extends` clause.

**Signature**

```ts
export type Extendable<T extends EffectFn> = T extends (...args: infer Args) => Effect.Effect<infer A, infer E, infer R>
  ? (...args: Args) => Effect.Effect<A, E, [R] extends [never] ? any : R>
  : never
```

Added in v1.0.0

### Success (type alias)

A helper for extracting the success of an EffectFn.

**Signature**

```ts
export type Success<T extends EffectFn> = T extends (
  ...args: infer _Args
) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
Effect.Effect<infer A, infer _E, infer _R>
  ? A
  : never
```

Added in v1.0.0
