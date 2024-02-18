---
title: Model.ts
nav_order: 13
parent: "@typed/context"
---

## Model overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Model](#model)
- [models](#models)
  - [Model (interface)](#model-interface)
  - [ModelRef (type alias)](#modelref-type-alias)
- [symbols](#symbols)
  - [ModelTypeId](#modeltypeid)
  - [ModelTypeId (type alias)](#modeltypeid-type-alias)
- [utils](#utils)
  - [Model (namespace)](#model-namespace)
    - [Identifier (type alias)](#identifier-type-alias)
    - [Of (type alias)](#of-type-alias)
    - [State (type alias)](#state-type-alias)

---

# constructors

## Model

Create a Model from a collection of Refs.

**Signature**

```ts
export declare function Model<const Refs extends Readonly<Record<string, ModelRef<any, any> | Model<any>>>>(
  refs: Refs
): Model<Refs>
```

Added in v1.0.0

# models

## Model (interface)

A Model is a collection of Refs that can be utilized as a single unit from the Effect Context.

**Signature**

```ts
export interface Model<Refs extends Readonly<Record<string, ModelRef<any, any> | Model<any>>>> {
  readonly [ModelTypeId]: ModelTypeId

  /**
   * A Lens into a Ref from any given model at a particular key.
   * @since 1.0.0
   */
  readonly fromKey: <K extends keyof Refs>(key: K) => Refs[K]

  /**
   * Get the current state of the Model
   * @since 1.0.0
   */
  readonly get: Effect.Effect<Model.State<this>, never, Model.Identifier<this>>

  /**
   * Set the state of the Model
   * @since 1.0.0
   */
  readonly set: (state: Model.State<this>) => Effect.Effect<void, never, Model.Identifier<this>>

  /**
   * Update the state of the Model
   * @since 1.0.0
   */
  readonly update: (
    f: (state: Model.State<this>) => Model.State<this>
  ) => Effect.Effect<void, never, Model.Identifier<this>>

  /**
   * Modify the state of the Model and return a value
   * @since 1.0.0
   */
  readonly modify: <B>(
    f: (state: Model.State<this>) => readonly [B, Model.State<this>]
  ) => Effect.Effect<B, never, Model.Identifier<this>>

  /**
   * Provide a Model to an Effect
   * @since 1.0.0
   */
  readonly provide: (
    state: Model.State<this>
  ) => <B, E, R>(effect: Effect.Effect<B, E, R>) => Effect.Effect<B, E, Exclude<R, Model.Identifier<this>> | Scope>

  /**
   * Construct a Layer to provide a Model to an Effect
   * @since 1.0.0
   */
  readonly layer: <E, R>(
    effect: Effect.Effect<Model.State<this>, E, R>
  ) => Layer.Layer<Model.Identifier<this>, E, Exclude<R, Scope>>
}
```

Added in v1.0.0

## ModelRef (type alias)

A ModelRef<I, A> is a Ref/ScopedRef/SynchronizedRef that is part of a Model.

**Signature**

```ts
export type ModelRef<I, A> = Ref<I, A> | ScopedRef<I, A> | SynchronizedRef<I, A>
```

Added in v1.0.0

# symbols

## ModelTypeId

**Signature**

```ts
export declare const ModelTypeId: typeof ModelTypeId
```

Added in v1.0.0

## ModelTypeId (type alias)

**Signature**

```ts
export type ModelTypeId = typeof ModelTypeId
```

Added in v1.0.0

# utils

## Model (namespace)

Added in v1.0.0

### Identifier (type alias)

Extract the Identifier of a Model

**Signature**

```ts
export type Identifier<T> =
  T extends Ref<infer I, infer _>
    ? I
    : T extends ScopedRef<infer I, infer _>
      ? I
      : T extends SynchronizedRef<infer I, infer _>
        ? I
        : T extends Model<infer R>
          ? { readonly [K in keyof R]: Identifier<R[K]> }[keyof R]
          : never
```

Added in v1.0.0

### Of (type alias)

Type-level helper for use in an "extends" clause to constrain the type of a Model
but not the Context needed to provide them.

**Signature**

```ts
export type Of<A> = {
  readonly [K in keyof A]: ModelRef<any, A[K]>
}
```

Added in v1.0.0

### State (type alias)

Extract the State of a Model

**Signature**

```ts
export type State<T> =
  T extends Ref<infer _, infer S>
    ? S
    : T extends ScopedRef<infer _, infer S>
      ? S
      : T extends SynchronizedRef<infer _, infer S>
        ? S
        : T extends Model<infer R>
          ? { readonly [K in keyof R]: State<R[K]> }
          : never
```

Added in v1.0.0
