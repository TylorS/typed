---
title: RefSubject.ts
nav_order: 6
parent: "@typed/fx"
---

## RefSubject overview

A RefSubject is the core abstraction for keeping state and subscribing to its
changes over time.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
  - [makeReplay](#makereplay)
  - [unsafeMake](#unsafemake)
  - [value](#value)
- [models](#models)
  - [RefSubject (interface)](#refsubject-interface)
- [symbols](#symbols)
  - [RefTypeId](#reftypeid)
  - [RefTypeId (type alias)](#reftypeid-type-alias)

---

# constructors

## make

Construct a RefSubject with a lazily initialized value.

**Signature**

```ts
export declare function make<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A>>
```

Added in v1.18.0

## makeReplay

Construct a RefSubject with an initial value and a capacity for replaying events.

**Signature**

```ts
export declare function makeReplay<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  {
    capacity,
    eq,
  }: {
    readonly capacity: number
    readonly eq?: Equivalence<A>
  }
): Effect.Effect<R, never, RefSubject<E, A>>
```

Added in v1.18.0

## unsafeMake

Construct a RefSubject with an initial value and the specified subject.

**Signature**

```ts
export declare function unsafeMake<E, A>(
  initial: Effect.Effect<never, E, A>,
  subject: Subject.Subject<never, E, A>,
  eq: Equivalence<A> = Equal.equals
): RefSubject<E, A>
```

Added in v1.18.0

## value

Construct a RefSubject from a synchronous value.

**Signature**

```ts
export declare function value<A, E = never>(
  initial: A,
  eq?: Equivalence<A>
): Effect.Effect<never, never, RefSubject<E, A>>
```

Added in v1.18.0

# models

## RefSubject (interface)

A RefSubject is a Subject that has a current value that can be read and updated.

**Signature**

```ts
export interface RefSubject<in out E, in out A> extends Subject.Subject<never, E, A>, Effect.Effect<never, E, A> {
  readonly [RefTypeId]: RefTypeId

  /**
   * The Equivalence used to determine if a value has changed. Defaults to `Equal.equals`.
   * @since 1.18.0
   */
  readonly eq: Equivalence<A>

  /**
   * Get the current value of this RefSubject. If the RefSubject has not been initialized
   * then the initial value will be computed and returned. Concurrent calls to `get` will
   * only compute the initial value once.
   * @since 1.18.0
   */
  readonly get: Effect.Effect<never, E, A>

  /**
   * Set the current value of this RefSubject.
   * @since 1.18.0
   */
  readonly set: (a: A) => Effect.Effect<never, never, A>

  /**
   * Modify the current value of this RefSubject using the provided function.
   * @since 1.18.0
   */
  readonly update: (f: (a: A) => A) => Effect.Effect<never, E, A>

  /**
   * Modify the current value of this RefSubject and compute a new value.
   * @since 1.18.0
   */
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<never, E, B>

  /**
   * Delete the current value of this RefSubject. If it was not initialized the Option.none will be returned.
   * Otherwise the current value will be returned as an Option.some and the RefSubject will be uninitialized.
   * If there are existing subscribers to this RefSubject then the RefSubject will be re-initialized.
   * @since 1.18.0
   */
  readonly delete: Effect.Effect<never, never, Option.Option<A>>

  /**
   * Modify the current value of this RefSubject and compute a new value using the provided effectful function.
   * @since 1.18.0
   */
  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<R2, E | E2, B>

  /**
   * Modify the current value of this RefSubject using the provided effectful function.
   * @since 1.18.0
   */
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R2, E | E2, A>

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Computed<never, E, B>

  /**
   * Map the current value of this Filtered to a new value using an Effect
   * @since 1.18.0
   */
  readonly filterMapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>) => Filtered<R2, E | E2, B>

  /**
   * Map the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<never, E, B>

  /**
   * @internal
   */
  readonly version: () => number
}
```

Added in v1.18.0

# symbols

## RefTypeId

**Signature**

```ts
export declare const RefTypeId: typeof RefTypeId
```

Added in v1.18.0

## RefTypeId (type alias)

**Signature**

```ts
export type RefTypeId = typeof RefTypeId
```

Added in v1.18.0
