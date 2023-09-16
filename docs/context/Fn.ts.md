---
title: Fn.ts
nav_order: 7
parent: "@typed/context"
---

## Fn overview

Helpers for create contextual services that are single functions that return
an Effect.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [symbols](#symbols)
  - [FnTypeId](#fntypeid)
  - [FnTypeId (type alias)](#fntypeid-type-alias)
- [utils](#utils)
  - [Fn](#fn)
  - [Fn (interface)](#fn-interface)
  - [Fn (namespace)](#fn-namespace)
    - [Any (type alias)](#any-type-alias)
    - [FnOf (type alias)](#fnof-type-alias)
    - [Identifier (type alias)](#identifier-type-alias)

---

# symbols

## FnTypeId

**Signature**

```ts
export declare const FnTypeId: typeof FnTypeId
```

Added in v1.0.0

## FnTypeId (type alias)

**Signature**

```ts
export type FnTypeId = typeof FnTypeId
```

Added in v1.0.0

# utils

## Fn

Create a new Fn

**Signature**

```ts
export declare function Fn<T extends EffectFn>()
```

Added in v1.0.0

## Fn (interface)

Fn is a helper for creating contextual services that are single functions that return
an Effect.

**Signature**

```ts
export interface Fn<Key, T extends EffectFn>
  // Brand T so that functions do not collide so easily
  extends Tag<Key, T> {
  readonly [FnTypeId]: FnTypeId

  /**
   * Call your effectful function with the provided arguments.
   * @since 1.0.0
   */
  readonly apply: <Args extends EffectFn.ArgsOf<T>>(
    ...args: Args
  ) => Effect.Effect<Key | EffectFn.Context<T>, EffectFn.Error<T>, EffectFn.Success<T>>

  /**
   * A helper to implement a Layer for your effectful function which
   * has more context requirements than the interface it is implementing.
   * @since 1.0.0
   */
  readonly implement: <T2 extends EffectFn.Extendable<T>>(
    implementation: T2
  ) => Layer.Layer<EffectFn.Context<T2>, never, Key>

  /**
   * A helper for implementing an providing a Layer to an Effect.
   * @since 1.0.0
   */
  readonly provideImplementation: {
    <T2 extends EffectFn.Extendable<T>>(implementation: T2): <R, E, A>(
      effect: Effect.Effect<R, E, A>
    ) => Effect.Effect<Exclude<R, Key> | EffectFn.Context<T2>, E | EffectFn.Error<T2>, A>

    <R, E, A, T2 extends EffectFn.Extendable<T>>(effect: Effect.Effect<R, E, A>, implementation: T2): Effect.Effect<
      Exclude<R, Key> | EffectFn.Context<T2>,
      E | EffectFn.Error<T2>,
      A
    >
  }
}
```

Added in v1.0.0

## Fn (namespace)

Added in v1.0.0

### Any (type alias)

Any Fn

**Signature**

```ts
export type Any = Fn<any, any>
```

Added in v1.0.0

### FnOf (type alias)

Extract the EffectFn of a Fn

**Signature**

```ts
export type FnOf<T extends Fn<any, any>> = T extends Fn<any, infer F> ? F : never
```

Added in v1.0.0

### Identifier (type alias)

Extract the Identifier of a Fn

**Signature**

```ts
export type Identifier<T extends Fn<any, any>> = T extends Fn<infer K, any> ? K : never
```

Added in v1.0.0
