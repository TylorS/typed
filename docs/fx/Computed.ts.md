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
- [utils](#utils)
  - [Computed](#computed)
  - [Computed (namespace)](#computed-namespace)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [combine](#combine)
  - [fromTag](#fromtag)
  - [provide](#provide)
  - [struct](#struct)

---

# models

## Computed (interface)

A Computed is a Subject that has a current value that can be read and observed

**Signature**

```ts
export interface Computed<out R, out E, out A> extends Versioned.Versioned<R, never, R, E, A, R, E, A> {
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

  /**
   * Skip values that match the provided Equivalence instance
   */
  readonly skipRepeats: (eq?: Equivalence.Equivalence<A>) => Computed<R, E, A>
}
```

Added in v1.18.0

# utils

## Computed

Create a Computed from a data type which is an Fx and an Effect.

**Signature**

```ts
export declare function Computed<R, E, A, R2, E2, B>(
  input: Versioned.Versioned<R, never, R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Computed<R | R2, E | E2, B>
```

Added in v1.18.0

## Computed (namespace)

Added in v1.18.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = [T] extends [Computed<infer R, infer _E, infer _A>] ? R : never
```

Added in v1.18.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = [T] extends [Computed<infer _R, infer E, infer _A>] ? E : never
```

Added in v1.18.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = [T] extends [Computed<infer _R, infer _E, infer A>] ? A : never
```

Added in v1.18.0

## combine

**Signature**

```ts
export declare function combine<const Computeds extends ReadonlyArray<Computed<any, any, any>>>(
  computeds: Computeds
): Computed<
  Fx.Context<Computeds[keyof Computeds]>,
  Fx.Error<Computeds[keyof Computeds]>,
  { readonly [K in keyof Computeds]: Fx.Success<Computeds[K]> }
>
```

Added in v1.18.0

## fromTag

**Signature**

```ts
export declare const fromTag: {
  <S, R2, E2, B>(f: (s: S) => Computed<R2, E2, B>): <I>(tag: Tag<I, S>) => Computed<R2 | I, E2, B>
  <I, S, R2, E2, B>(tag: Tag<I, S>, f: (s: S) => Computed<R2, E2, B>): Computed<I | R2, E2, B>
}
```

Added in v1.18.0

## provide

**Signature**

```ts
export declare const provide: {
  <R2, E2, S>(
    layer: Layer.Layer<R2, E2, S>
  ): <R, E, A>(computed: Computed<R, E, A>) => Computed<R2 | Exclude<R, S>, E2 | E, A>
  <S>(runtime: Runtime.Runtime<S>): <R, E, A>(computed: Computed<R, E, A>) => Computed<Exclude<R, S>, E, A>
  <S>(context: Context.Context<S>): <R, E, A>(computed: Computed<R, E, A>) => Computed<Exclude<R, S>, E, A>
  <R2, E2, S>(
    layer: Layer.Layer<R2, E2, S>
  ): <R, E, A>(computed: Computed<R, E, A>) => Computed<R2 | Exclude<R, S>, E2 | E, A>
  <R, E, A, R2, E2, S>(
    computed: Computed<R, E, A>,
    layer: Layer.Layer<R2, E2, S>
  ): Computed<R2 | Exclude<R, S>, E | E2, A>
  <R, E, A, S>(computed: Computed<R, E, A>, runtime: Runtime.Runtime<S>): Computed<Exclude<R, S>, E, A>
  <R, E, A, S>(computed: Computed<R, E, A>, context: Context.Context<S>): Computed<Exclude<R, S>, E, A>
}
```

Added in v1.18.0

## struct

**Signature**

```ts
export declare function struct<const Computeds extends Readonly<Record<string, Computed<any, any, any>>>>(
  computeds: Computeds
): Computed<
  Computed.Context<Computeds[keyof Computeds]>,
  Computed.Error<Computeds[keyof Computeds]>,
  { readonly [K in keyof Computeds]: Computed.Success<Computeds[K]> }
>
```

Added in v1.18.0
