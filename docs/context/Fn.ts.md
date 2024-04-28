---
title: Fn.ts
nav_order: 8
parent: "@typed/context"
---

## Fn overview

Helpers for create contextual services that are single functions that return
an Effect.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Fn](#fn)
- [models](#models)
  - [Fn (interface)](#fn-interface)
- [symbols](#symbols)
  - [FnTypeId](#fntypeid)
  - [FnTypeId (type alias)](#fntypeid-type-alias)
- [utils](#utils)
  - [Fn (namespace)](#fn-namespace)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [FnOf (type alias)](#fnof-type-alias)
    - [Identifier (type alias)](#identifier-type-alias)

---

# constructors

## Fn

Create a new Fn

**Signature**

```ts
export declare function Fn<T extends EffectFn>(): {
  <const Id extends IdentifierFactory<any>>(id: Id): Fn<IdentifierOf<Id>, T>
  <const Id>(id: Id): Fn<IdentifierOf<Id>, T>
}
```

Added in v1.0.0

# models

## Fn (interface)

Fn is a helper for creating contextual services that are single functions that return
an Effect.

**Signature**

```ts
export interface Fn<I, T extends EffectFn> extends Tagged<I, T> {
  readonly [FnTypeId]: FnTypeId

  /**
   * Call your effectful function with the provided arguments.
   * @since 1.0.0
   */
  <Args extends EffectFn.ArgsOf<T>>(
    ...args: Args
  ): Effect.Effect<EffectFn.Success<T>, EffectFn.Error<T>, I | EffectFn.Context<T>>

  /**
   * Call your effectful function with the provided arguments.
   * @since 1.0.0
   */
  readonly call: (
    ...args: EffectFn.ArgsOf<T>
  ) => Effect.Effect<EffectFn.Success<T>, EffectFn.Error<T>, I | EffectFn.Context<T>>

  /**
   * Call your effectful function with the provided arguments.
   * @since 1.0.0
   */
  readonly apply: (
    args: EffectFn.ArgsOf<T>
  ) => Effect.Effect<EffectFn.Success<T>, EffectFn.Error<T>, I | EffectFn.Context<T>>

  /**
   * A helper to implement a Layer for your effectful function which
   * has more context requirements than the interface it is implementing.
   * @since 1.0.0
   */
  readonly implement: <T2 extends EffectFn.Extendable<T>>(
    implementation: T2
  ) => Layer.Layer<I, never, EffectFn.Context<T2>>

  /**
   * A helper for implementing an providing a Layer to an Effect.
   * @since 1.0.0
   */
  readonly provideImplementation: {
    <T2 extends EffectFn.Extendable<T>>(
      implementation: T2
    ): <A, E, R>(
      effect: Effect.Effect<A, E, R>
    ) => Effect.Effect<A, E | EffectFn.Error<T2>, Exclude<R, I> | EffectFn.Context<T2>>

    <A, E, R, T2 extends EffectFn.Extendable<T>>(
      effect: Effect.Effect<A, E, R>,
      implementation: T2
    ): Effect.Effect<A, E | EffectFn.Error<T2>, Exclude<R, I> | EffectFn.Context<T2>>
  }
}
```

Added in v1.0.0

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

## Fn (namespace)

Added in v1.0.0

### Any (type alias)

Any Fn

**Signature**

```ts
export type Any = Fn<any, any>
```

Added in v1.0.0

### Context (type alias)

Extract the Identifier of a Fn

**Signature**

```ts
export type Context<T extends Fn<any, any>> =
  T extends Fn<infer K, infer F> ? K | Effect.Effect.Context<ReturnType<F>> : never
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
