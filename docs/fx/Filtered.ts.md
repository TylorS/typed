---
title: Filtered.ts
nav_order: 3
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
- [utils](#utils)
  - [Filtered](#filtered)
  - [combine](#combine)
  - [fromTag](#fromtag)
  - [provide](#provide)
  - [struct](#struct)

---

# models

## Filtered (interface)

A Filtered is a Subject that has a current value that can be read and observed
but getting the value might not succeed

**Signature**

```ts
export interface Filtered<out R, out E, out A>
  extends Versioned.Versioned<R, never, R, E, A, R, E | Cause.NoSuchElementException, A> {
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
   * Convert a Filtered back into a Computed of an Option
   */
  readonly option: Computed<R, E, Option.Option<A>>

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

  /**
   * Skip values that match the provided Equivalence instance
   */
  readonly skipRepeats: (eq?: Equivalence<A>) => Filtered<R, E, A>
}
```

Added in v1.18.0

# utils

## Filtered

Create a Filtered from a data type which is an Fx and an Effect.

**Signature**

```ts
export declare function Filtered<R, E, A, R2, E2, B>(
  input: Versioned.Versioned<R, never, R, E, A, R, E | Cause.NoSuchElementException, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Filtered<R | R2, E | E2, B>
```

Added in v1.18.0

## combine

**Signature**

```ts
export declare function combine<
  const Computeds extends ReadonlyArray<Filtered<any, any, any> | Computed<any, any, any>>
>(
  computeds: Computeds
): Filtered<
  Fx.Fx.Context<Computeds[number]>,
  Fx.Fx.Error<Computeds[number]>,
  { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[number]> }
>
```

Added in v1.18.0

## fromTag

**Signature**

```ts
export declare const fromTag: {
  <S, R2, E2, B>(f: (s: S) => Filtered<R2, E2, B>): <I>(tag: Tag<I, S>) => Filtered<R2 | I, E2, B>
  <I, S, R2, E2, B>(tag: Tag<I, S>, f: (s: S) => Filtered<R2, E2, B>): Filtered<I | R2, E2, B>
}
```

Added in v1.18.0

## provide

**Signature**

```ts
export declare const provide: {
  <R2, E2, S>(
    layer: Layer.Layer<R2, E2, S>
  ): <R, E, A>(filtered: Filtered<R, E, A>) => Filtered<R2 | Exclude<R, S>, E2 | E, A>
  <S>(runtime: Runtime.Runtime<S>): <R, E, A>(filtered: Filtered<R, E, A>) => Filtered<Exclude<R, S>, E, A>
  <S>(context: Context.Context<S>): <R, E, A>(filtered: Filtered<R, E, A>) => Filtered<Exclude<R, S>, E, A>
  <R2, E2, S>(
    layer: Layer.Layer<R2, E2, S>
  ): <R, E, A>(filtered: Filtered<R, E, A>) => Filtered<R2 | Exclude<R, S>, E2 | E, A>
  <R, E, A, R2, E2, S>(
    filtered: Filtered<R, E, A>,
    layer: Layer.Layer<R2, E2, S>
  ): Filtered<R2 | Exclude<R, S>, E | E2, A>
  <R, E, A, S>(filtered: Filtered<R, E, A>, runtime: Runtime.Runtime<S>): Filtered<Exclude<R, S>, E, A>
  <R, E, A, S>(filtered: Filtered<R, E, A>, context: Context.Context<S>): Filtered<Exclude<R, S>, E, A>
}
```

Added in v1.18.0

## struct

**Signature**

```ts
export declare function struct<
  const Computeds extends Readonly<Record<string, Filtered<any, any, any | Computed<any, any, any>>>>
>(
  computeds: Computeds
): Filtered<
  Fx.Fx.Context<Computeds[keyof Computeds]>,
  Fx.Fx.Error<Computeds[keyof Computeds]>,
  { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[K]> }
>
```

Added in v1.18.0
