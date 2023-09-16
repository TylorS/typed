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

- [utils](#utils)
  - [EffectFn (interface)](#effectfn-interface)
  - [EffectFn (namespace)](#effectfn-namespace)
    - [ArgsOf (type alias)](#argsof-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Extendable (type alias)](#extendable-type-alias)
    - [Success (type alias)](#success-type-alias)

---

# utils

## EffectFn (interface)

EffectFn is a type-alias for a function that returns an Effect.

**Signature**

```ts
export interface EffectFn<Args extends ReadonlyArray<any> = ReadonlyArray<any>, R = any, E = any, A = any> {
  (...args: Args): Effect.Effect<R, E, A>
}
```

Added in v1.0.0

## EffectFn (namespace)

Added in v1.0.0

### ArgsOf (type alias)

A helper for extracting the arguments of an EffectFn.

**Signature**

```ts
export type ArgsOf<T extends EffectFn> = T extends (
  ...args: infer Args
) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
Effect.Effect<infer _R, infer _E, infer _A>
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
Effect.Effect<infer R, infer _E, infer _A>
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
Effect.Effect<infer _R, infer E, infer _A>
  ? E
  : never
```

Added in v1.0.0

### Extendable (type alias)

A helper for utilizing an EffectFn in an `extends` clause.

**Signature**

```ts
export type Extendable<T extends EffectFn> = T extends (...args: infer Args) => Effect.Effect<infer R, infer E, infer A>
  ? (...args: Args) => Effect.Effect<[R] extends [never] ? any : R, E, A>
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
Effect.Effect<infer _R, infer _E, infer A>
  ? A
  : never
```

Added in v1.0.0
