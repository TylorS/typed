---
title: Filtered.ts
nav_order: 8
parent: "@typed/fx"
---

## Filtered overview

A Filtered is a Subject that has a current value that can be read and observed
but getting the value might not succeed

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [models](#models)
  - [Filtered (interface)](#filtered-interface)
- [symbols](#symbols)
  - [FilteredTypeId](#filteredtypeid)
  - [FilteredTypeId (type alias)](#filteredtypeid-type-alias)
- [utils](#utils)
  - [Filtered](#filtered)

---

# models

## Filtered (interface)

A Filtered is a Subject that has a current value that can be read and observed
but getting the value might not succeed

**Signature**

```ts
export interface Filtered<out R, out E, out A>
  extends VersionedFxEffect<R, R, E, A, R, E | Cause.NoSuchElementException, A> {
  readonly [FilteredTypeId]: FilteredTypeId

  /**
   * Map the current value of this Filtered to a new value using an Effect
   * @since 1.18.0
   */
  readonly filterMapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<R | R2, E | E2, B>

  /**
   * Map the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<R, E, B>

  /**
   * Filter the current value of this Filtered to a new value using an Effect
   */
  readonly filterEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>) => Filtered<R | R2, E | E2, A>

  /**
   * Filter the current value of this Filtered to a new value
   */
  readonly filter: (f: (a: A) => boolean) => Filtered<R, E, A>

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Filtered<R | R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Filtered<R, E, B>
}
```

Added in v1.18.0

# symbols

## FilteredTypeId

**Signature**

```ts
export declare const FilteredTypeId: typeof FilteredTypeId
```

Added in v1.18.0

## FilteredTypeId (type alias)

**Signature**

```ts
export type FilteredTypeId = typeof FilteredTypeId
```

Added in v1.18.0

# utils

## Filtered

Create a Filtered from a data type which is an Fx and an Effect.

**Signature**

```ts
export declare function Filtered<R, E, A, R2, E2, B>(
  input: VersionedFxEffect<R, R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Filtered<R | R2, E | E2, B>
```

Added in v1.18.0
