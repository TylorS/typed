---
title: Context/Model.ts
nav_order: 3
parent: "@typed/fx"
---

## Model overview

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Model](#model)
- [models](#models)
  - [Model (interface)](#model-interface)
- [symbols](#symbols)
  - [ModelTypeId](#modeltypeid)
  - [ModelTypeId (type alias)](#modeltypeid-type-alias)
- [utils](#utils)
  - [Model (namespace)](#model-namespace)
    - [Error (type alias)](#error-type-alias)
    - [Identifier (type alias)](#identifier-type-alias)
    - [State (type alias)](#state-type-alias)

---

# constructors

## Model

Create a Model from a collection of Refs.

**Signature**

```ts
export declare function Model<const Refs extends Readonly<Record<string, Any>>>(refs: Refs): Model<Refs>
```

Added in v1.18.0

# models

## Model (interface)

A Model is a collection of Refs that can be utilized as a single unit from the Effect Context.

**Signature**

```ts
export interface Model<Refs extends Readonly<Record<string, Any>>>
  extends VersionedFxEffect<
    Model.Identifier<Refs[keyof Refs]>,
    Model.Identifier<Refs[keyof Refs]>,
    Model.Error<Refs[keyof Refs]>,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    },
    Model.Identifier<Refs[keyof Refs]>,
    Model.Error<Refs[keyof Refs]>,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  > {
  readonly [ModelTypeId]: ModelTypeId

  /**
   * A Lens into a Ref from any given model at a particular key.
   * @since 1.18.0
   */
  readonly fromKey: <K extends keyof Refs>(key: K) => Refs[K]

  /**
   * Get the current state of the Model
   * @since 1.18.0
   */
  readonly get: Effect.Effect<
    Model.Identifier<Refs[keyof Refs]>,
    never,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  >

  /**
   * Set the state of the Model
   * @since 1.18.0
   */
  readonly set: (state: {
    readonly [K in keyof Refs]: Model.State<Refs[K]>
  }) => Effect.Effect<Model.Identifier<Refs[keyof Refs]>, never, void>

  /**
   * Update the state of the Model
   * @since 1.18.0
   */
  readonly update: (
    f: (state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }) => {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  ) => Effect.Effect<Model.Identifier<Refs[keyof Refs]>, never, void>

  /**
   * Modify the state of the Model and return a value
   * @since 1.18.0
   */
  readonly modify: <B>(
    f: (state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }) => readonly [
      B,
      {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ]
  ) => Effect.Effect<Model.Identifier<Refs[keyof Refs]>, never, B>

  /**
   * Delete the model's state
   */
  readonly delete: Effect.Effect<
    Model.Identifier<Refs[keyof Refs]>,
    never,
    Option.Option<{
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }>
  >

  readonly mapEffect: <R2, E2, B>(
    f: (state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }) => Effect.Effect<R2, E2, B>
  ) => Computed<Model.Identifier<Refs[keyof Refs]> | R2, Model.Error<Refs[keyof Refs]> | E2, B>

  readonly map: <B>(
    f: (state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }) => B
  ) => Computed<Model.Identifier<Refs[keyof Refs]>, Model.Error<Refs[keyof Refs]>, B>

  readonly filterMapEffect: <R2, E2, B>(
    f: (state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<Model.Identifier<Refs[keyof Refs]> | R2, Model.Error<Refs[keyof Refs]> | E2, B>

  readonly filterMap: <B>(
    f: (state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }) => Option.Option<B>
  ) => Filtered<Model.Identifier<Refs[keyof Refs]>, Model.Error<Refs[keyof Refs]>, B>

  readonly filterEffect: <R2, E2>(
    f: (state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }) => Effect.Effect<R2, E2, boolean>
  ) => Filtered<
    Model.Identifier<Refs[keyof Refs]> | R2,
    Model.Error<Refs[keyof Refs]> | E2,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  >

  readonly filter: (
    f: (state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }) => boolean
  ) => Filtered<
    Model.Identifier<Refs[keyof Refs]>,
    Model.Error<Refs[keyof Refs]>,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  >

  // TODO: Model provision should enable all possibilities of RefSubject provision

  /**
   * Provide a Model to an Effect
   * @since 1.18.0
   */
  readonly of: (
    state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    },
    eqs?: {
      readonly [K in keyof Refs]?: Equivalence<Model.State<Refs[K]>>
    }
  ) => Layer.Layer<never, never, Model.Identifier<Refs[keyof Refs]>>

  /**
   * Construct a Layer to provide a Model to an Effect
   * @since 1.18.0
   */
  readonly fromEffect: <R, E>(
    effect: Effect.Effect<
      R,
      E,
      {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    >,
    eqs?: {
      readonly [K in keyof Refs]?: Equivalence<Model.State<Refs[K]>>
    }
  ) => Layer.Layer<Exclude<R, Scope>, E, Model.Identifier<Refs[keyof Refs]>>

  /**
   * Create a Layer from a Model using the Layers of each Ref
   * @since 1.18.0
   */
  readonly makeWith: <
    Opts extends {
      readonly [K in keyof Refs]: (
        ref: Refs[K]
      ) => Layer.Layer<any, any, Model.Identifier<Refs[K]>> | Layer.Layer<any, never, Model.Identifier<Refs[K]>>
    }
  >(
    options: Opts
  ) => Layer.Layer<
    Exclude<Layer.Layer.Context<ReturnType<Opts[keyof Refs]>>, Scope>,
    Layer.Layer.Error<ReturnType<Opts[keyof Refs]>>,
    Model.Identifier<Refs[keyof Refs]>
  >

  /**
   * Create a Layer from a Model using the Layers of each Ref
   * @since 1.18.0
   */
  readonly make: <
    Opts extends {
      readonly [K in keyof Refs]: Fx<any, Model.Error<Refs[K]>, Model.State<Refs[K]>>
    }
  >(
    options: Opts,
    eqs?: {
      readonly [K in keyof Refs]?: Equivalence<Model.State<Refs[K]>>
    }
  ) => Layer.Layer<Exclude<Fx.Context<Opts[keyof Refs]>, Scope>, never, Model.Identifier<Refs[keyof Refs]>>
}
```

Added in v1.18.0

# symbols

## ModelTypeId

**Signature**

```ts
export declare const ModelTypeId: typeof ModelTypeId
```

Added in v1.18.0

## ModelTypeId (type alias)

**Signature**

```ts
export type ModelTypeId = typeof ModelTypeId
```

Added in v1.18.0

# utils

## Model (namespace)

Added in v1.18.0

### Error (type alias)

Extract the Error of a Model

**Signature**

```ts
export type Error<T> = T extends RefSubject<infer _, infer E, infer _>
  ? E
  : T extends Model<infer R>
  ? { readonly [K in keyof R]: Error<R[K]> }[keyof R]
  : never
```

Added in v1.18.0

### Identifier (type alias)

Extract the Identifier of a Model

**Signature**

```ts
export type Identifier<T> = T extends RefSubject<infer I, infer _, infer __>
  ? I
  : T extends Model<infer R>
  ? { readonly [K in keyof R]: Identifier<R[K]> }[keyof R]
  : never
```

Added in v1.18.0

### State (type alias)

Extract the State of a Model

**Signature**

```ts
export type State<T> = T extends RefSubject<infer _, infer __, infer S>
  ? S
  : T extends Model<infer R>
  ? { readonly [K in keyof R]: State<R[K]> }
  : never
```

Added in v1.18.0
