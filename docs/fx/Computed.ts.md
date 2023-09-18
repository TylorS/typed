---
title: Computed.ts
nav_order: 1
parent: "@typed/fx"
---

## Computed overview

A Computed is a Subject that has a current value that can be read and observed

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [models](#models)
  - [Computed (interface)](#computed-interface)
- [symbols](#symbols)
  - [ComputedTypeId](#computedtypeid)
  - [ComputedTypeId (type alias)](#computedtypeid-type-alias)
- [utils](#utils)
  - [Computed](#computed)

---

# models

## Computed (interface)

A Computed is a Subject that has a current value that can be read and observed

**Signature**

```ts
export interface Computed<out R, out E, out A> extends VersionedFxEffect<R, R, E, A, R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R | R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Computed<R, E, B>

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
}
```

Added in v1.18.0

# symbols

## ComputedTypeId

**Signature**

```ts
export declare const ComputedTypeId: typeof ComputedTypeId
```

Added in v1.18.0

## ComputedTypeId (type alias)

**Signature**

```ts
export type ComputedTypeId = typeof ComputedTypeId
```

Added in v1.18.0

# utils

## Computed

Create a Computed from a data type which is an Fx and an Effect.

**Signature**

```ts
export declare function Computed<R, E, A, R2, E2, B>(
  input: VersionedFxEffect<R, R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Computed<R | R2, E | E2, B>
```

Added in v1.18.0
