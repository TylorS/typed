---
title: Context/RefSubject.ts
nav_order: 4
parent: "@typed/fx"
---

## RefSubject overview

A Contextual wrapper around a RefSubject

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [RefSubject](#refsubject)
- [models](#models)
  - [RefSubject (interface)](#refsubject-interface)
- [utils](#utils)
  - [RefSubject (namespace)](#refsubject-namespace)
    - [Error (type alias)](#error-type-alias)
    - [Identifier (type alias)](#identifier-type-alias)
    - [State (type alias)](#state-type-alias)

---

# constructors

## RefSubject

Create a contextual wrapper around a RefSubject while maintaing the full API of
a Ref Subject.

**Signature**

```ts
export declare function RefSubject<E, A>(): {
  <const I extends Context.IdentifierConstructor<any>>(identifier: (id: typeof Context.id) => I): RefSubject<
    Context.IdentifierOf<I>,
    E,
    A
  >
  <const I>(identifier: I): RefSubject<Context.IdentifierOf<I>, E, A>
}
```

Added in v1.18.0

# models

## RefSubject (interface)

A Contextual wrapper around a RefSubject

**Signature**

```ts
export interface RefSubject<I, E, A> extends VersionedFxEffect<I, I, E, A, I, E, A> {
  readonly tag: Context.Tagged<I, Ref.RefSubject<E, A>>

  readonly get: Effect.Effect<I, E, A>

  readonly set: (a: A) => Effect.Effect<I, never, A>

  readonly update: (f: (a: A) => A) => Effect.Effect<I, E, A>

  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<I, E, B>

  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<I | R2, E | E2, B>

  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<I | R2, E | E2, A>

  readonly delete: Effect.Effect<I, never, Option.Option<A>>

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Computed<I, E, B>

  /**
   * Filter and map the current value of this Filtered to a new value using an Effect
   * @since 1.18.0
   */
  readonly filterMapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>) => Filtered<R2, E | E2, B>

  /**
   * Filter ad map the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<never, E, B>

  /**
   * Make a layer initializing a RefSubject
   * @since 1.18.0
   */
  readonly make: <R>(fx: Fx<R, E, A>, eq?: Equivalence<A>) => Layer.Layer<R, never, I>

  /**
   * Provide an implementation of this RefSubject
   * @since 1.18.0
   */
  readonly provide: <R2>(
    fx: Fx<R2, E, A>,
    eq?: Equivalence<A>
  ) => <R3, E3, C>(effect: Effect.Effect<R3, E3, C>) => Effect.Effect<R2 | Exclude<R3, I>, E | E3, C>

  /**
   * Provide an implementation of this RefSubject
   * @since 1.18.0
   */
  readonly provideFx: <R2>(
    fx: Fx<R2, E, A>,
    eq?: Equivalence<A>
  ) => <R3, E3, C>(effect: Fx<R3, E3, C>) => Fx<R2 | Exclude<R3, I>, E | E3, C>
}
```

Added in v1.18.0

# utils

## RefSubject (namespace)

Added in v1.18.0

### Error (type alias)

Extract the Error from a RefSubject

**Signature**

```ts
export type Error<T> = T extends RefSubject<infer _, infer E, infer __> ? E : never
```

Added in v1.18.0

### Identifier (type alias)

Extract the Identifier from a RefSubject

**Signature**

```ts
export type Identifier<T> = T extends RefSubject<infer I, infer _, infer __> ? I : never
```

Added in v1.18.0

### State (type alias)

Extract the State from a RefSubject

**Signature**

```ts
export type State<T> = T extends RefSubject<infer _, infer __, infer S> ? S : never
```

Added in v1.18.0
