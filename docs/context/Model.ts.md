---
title: Model.ts
nav_order: 14
parent: "@typed/context"
---

## Model overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [symbols](#symbols)
  - [ModelTypeId](#modeltypeid)
  - [ModelTypeId (type alias)](#modeltypeid-type-alias)
- [utils](#utils)
  - [Model](#model)
  - [Model (interface)](#model-interface)
  - [Model (namespace)](#model-namespace)
    - [Identifier (type alias)](#identifier-type-alias)
    - [Of (type alias)](#of-type-alias)
    - [State (type alias)](#state-type-alias)
  - [ModelRef (type alias)](#modelref-type-alias)

---

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

## Model

Create a Model from a collection of Refs.

**Signature**

```ts
export declare function Model<const Refs extends Readonly<Record<string, ModelRef<any, any> | Model<any>>>>(
  refs: Refs
): Model<Refs>
```

Added in v1.0.0

## Model (interface)

A Model is a collection of Refs that can be utilized as a single unit from the Effect Context.

**Signature**

```ts
export interface Model<Refs extends Readonly<Record<string, ModelRef<any, any> | Model<any>>>> {
  readonly [ModelTypeId]: ModelTypeId

  // Gain access to a Ref by key
  readonly fromKey: <K extends keyof Refs>(key: K) => Refs[K]

  // Simple Ref operations
  readonly get: Effect.Effect<Model.Identifier<this>, never, Model.State<this>>
  readonly set: (state: Model.State<this>) => Effect.Effect<Model.Identifier<this>, never, void>
  readonly update: (
    f: (state: Model.State<this>) => Model.State<this>
  ) => Effect.Effect<Model.Identifier<this>, never, void>
  readonly modify: <B>(
    f: (state: Model.State<this>) => readonly [B, Model.State<this>]
  ) => Effect.Effect<Model.Identifier<this>, never, B>

  // Provision
  readonly provide: (
    state: Model.State<this>
  ) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, Model.Identifier<this>> | Scope, E, B>
}
```

Added in v1.0.0

## Model (namespace)

Added in v1.0.0

### Identifier (type alias)

Extract the Identifier of a Model

**Signature**

```ts
export type Identifier<T> = T extends Ref<infer I, infer _>
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
export type State<T> = T extends Ref<infer _, infer S>
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

## ModelRef (type alias)

A ModelRef<I, A> is a Ref/ScopedRef/SynchronizedRef that is part of a Model.

**Signature**

```ts
export type ModelRef<I, A> = Ref<I, A> | ScopedRef<I, A> | SynchronizedRef<I, A>
```

Added in v1.0.0
