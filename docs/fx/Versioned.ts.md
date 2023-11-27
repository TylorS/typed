---
title: Versioned.ts
nav_order: 27
parent: "@typed/fx"
---

## Versioned overview

This module provides a data type which is both an Fx and an Effect. This is a more advanced types, and is the basis
for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
an at type which is both Fx + Effect.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [map](#map)
  - [mapEffect](#mapeffect)
  - [transform](#transform)
  - [transformEffect](#transformeffect)
  - [transformFx](#transformfx)
- [constructors](#constructors)
  - [make](#make)
  - [of](#of)
- [models](#models)
  - [Versioned (interface)](#versioned-interface)
- [utils](#utils)
  - [Versioned (namespace)](#versioned-namespace)
    - [VersionContext (type alias)](#versioncontext-type-alias)
    - [VersionError (type alias)](#versionerror-type-alias)
  - [combine](#combine)
  - [provide](#provide)
  - [struct](#struct)

---

# combinators

## map

Transform a Versioned's output value as both an Fx and Effect.

**Signature**

```ts
export declare const map: {
  <R, E, A, C, B, D>(options: {
    onFx: (a: A) => C
    onEffect: (b: B) => D
  }): <R0, E0, R2, E2>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R, E, C, R0 | R2, E0 | E2, D>
  <R0, E0, R, E, A, R2, E2, B, C, D>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    options: { onFx: (a: A) => C; onEffect: (b: B) => D }
  ): Versioned<never, never, R, E, C, R0 | R2, E0 | E2, D>
}
```

Added in v1.18.0

## mapEffect

Transform a Versioned's output value as both an Fx and Effect using an Effect.

**Signature**

```ts
export declare const mapEffect: {
  <A, R3, E3, C, B, R4, E4, D>(options: {
    onFx: (a: A) => Effect.Effect<R3, E3, C>
    onEffect: (b: B) => Effect.Effect<R4, E4, D>
  }): <R0, E0, R, E, R2, E2>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R3 | R, E3 | E, C, R4 | R0 | R2, E4 | E0 | E2, D>
  <R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    options: { onFx: (a: A) => Effect.Effect<R3, E3, C>; onEffect: (b: B) => Effect.Effect<R4, E4, D> }
  ): Versioned<never, never, R | R3, E | E3, C, R0 | R2 | R4, E0 | E2 | E4, D>
}
```

Added in v1.18.0

## transform

Transform a Versioned as an Fx and as an Effect separately.

**Signature**

```ts
export declare const transform: {
  <R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    transformFx: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
    transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ): <R0, E0>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R3, E3, C, R4 | R0, E4 | E0, D>
  <R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    transformFx: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
    transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ): Versioned<never, never, R3, E3, C, R0 | R4, E0 | E4, D>
}
```

Added in v1.18.0

## transformEffect

Transform a Versioned as an Effect separately from its Fx interface.

**Signature**

```ts
export declare const transformEffect: {
  <R2, E2, B, R3, E3, C>(
    f: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R3, E3, C>
  ): <R0, E0, R, E, A>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R, E, A, R3 | R0, E3 | E0, C>
  <R0, E0, R, E, A, R2, E2, B, R3, E3, C>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    f: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R3, E3, C>
  ): Versioned<never, never, R, E, A, R0 | R3, E0 | E3, C>
}
```

Added in v1.18.0

## transformFx

Transform a Versioned as an Fx separately from its Effect interface.

**Signature**

```ts
export declare const transformFx: {
  <R, E, A, R3, E3, C>(
    f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>
  ): <R0, E0, R2, E2, B>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R3, E3, C, R0 | R2, E0 | E2, B>
  <R0, E0, R, E, A, R2, E2, B, R3, E3, C>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>
  ): Versioned<never, never, R3, E3, C, R0 | R2, E0 | E2, B>
}
```

Added in v1.18.0

# constructors

## make

Construct a Versioned type.

**Signature**

```ts
export declare const make: <R0, E0, R, E, A, R2, E2, B>({
  effect,
  fx,
  version
}: {
  version: Effect.Effect<R0, E0, number>
  fx: Fx.Fx<R, E, A>
  effect: Effect.Effect<R2, E2, B>
}) => Versioned<R0, E0, R, E, A, R2, E2, B>
```

Added in v1.18.0

## of

Construct a Versioned type from a static value.

**Signature**

```ts
export declare const of: <A>(value: A) => Versioned<never, never, never, never, A, never, never, A>
```

Added in v1.18.0

# models

## Versioned (interface)

A data type which is both an Fx and an Effect. This is a more advanced type, and is the basis
for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
an at type which is both an Fx and an Effect.

The Fx portion naturally has representations for dealing with keeping things up-to-date and
avoiding doing any work that is not necessary. The Effect, or "pull", portion utilizes the
version to determine if the current value is up to date. If it is not, then the Fx portion
will be run to update the value. This allows for derived types to cache values locally and
avoid doing any work if the value is up to date.

**Signature**

```ts
export interface Versioned<R0, E0, R, E, A, R2, E2, B> extends Fx.Fx<R, E, A>, Effect.Effect<R2, E2, B> {
  /**
   * The current version of this FxEffect. This is used to determine if the current value
   * is up to date to allow localized caching of value.
   */
  readonly version: Effect.Effect<R0, E0, number>
}
```

Added in v1.18.0

# utils

## Versioned (namespace)

Added in v1.18.0

### VersionContext (type alias)

**Signature**

```ts
export type VersionContext<T> = T extends Versioned<
  infer R0,
  infer _E0,
  infer _R,
  infer _E,
  infer _A,
  infer _R2,
  infer _E2,
  infer _B
>
  ? R0
  : never
```

Added in v1.18.0

### VersionError (type alias)

**Signature**

```ts
export type VersionError<T> = T extends Versioned<
  infer _R0,
  infer E0,
  infer _R,
  infer _E,
  infer _A,
  infer _R2,
  infer _E2,
  infer _B
>
  ? E0
  : never
```

Added in v1.18.0

## combine

**Signature**

```ts
export declare function combine<const VS extends ReadonlyArray<Versioned<any, any, any, any, any, any, any, any>>>(
  versioneds: VS
): Versioned<
  Versioned.VersionContext<VS[number]>,
  Versioned.VersionError<VS[number]>,
  Fx.Fx.Context<VS[number]>,
  Fx.Fx.Error<VS[number]>,
  { readonly [K in keyof VS]: Fx.Fx.Success<VS[K]> },
  Effect.Effect.Context<VS[number]>,
  Effect.Effect.Error<VS[number]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> }
>
```

Added in v1.0.0

## provide

**Signature**

```ts
export declare const provide: {
  <R3, E3, C3>(
    layer: Layer.Layer<R3, E3, C3>
  ): <R0, E0, R1, E1, A1, R2, E2, B2>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>
  ) => Versioned<
    never,
    never,
    R3 | Exclude<R1, C3>,
    E3 | E1,
    A1,
    R3 | Exclude<R0, C3> | Exclude<R2, C3>,
    E3 | E0 | E2,
    B2
  >
  <C3>(
    runtime: Runtime.Runtime<C3>
  ): <R0, E0, R1, E1, A1, R2, E2, B2>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>
  ) => Versioned<never, never, Exclude<R1, C3>, E1, A1, Exclude<R0, C3> | Exclude<R2, C3>, E0 | E2, B2>
  <C3>(
    context: Context.Context<C3>
  ): <R0, E0, R1, E1, A1, R2, E2, B2>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>
  ) => Versioned<never, never, Exclude<R1, C3>, E1, A1, Exclude<R0, C3> | Exclude<R2, C3>, E0 | E2, B2>
  <R0, E0, R1, E1, A1, R2, E2, B2, R3, E3, C3>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>,
    layer: Layer.Layer<R3, E3, C3>
  ): Versioned<
    never,
    never,
    R3 | Exclude<R1, C3>,
    E1 | E3,
    A1,
    R3 | Exclude<R0, C3> | Exclude<R2, C3>,
    E0 | E2 | E3,
    B2
  >
  <R0, E0, R1, E1, A1, R2, E2, B2, C3>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>,
    runtime: Runtime.Runtime<C3>
  ): Versioned<never, never, Exclude<R1, C3>, E1, A1, Exclude<R0, C3> | Exclude<R2, C3>, E0 | E2, B2>
  <R0, E0, R1, E1, A1, R2, E2, B2, C3>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>,
    context: Context.Context<C3>
  ): Versioned<never, never, Exclude<R1, C3>, E1, A1, Exclude<R0, C3> | Exclude<R2, C3>, E0 | E2, B2>
}
```

Added in v1.0.0

## struct

**Signature**

```ts
export declare function struct<
  const VS extends Readonly<Record<string, Versioned<any, any, any, any, any, any, any, any>>>
>(
  versioneds: VS
): Versioned<
  Versioned.VersionContext<VS[keyof VS]>,
  Versioned.VersionError<VS[keyof VS]>,
  Fx.Fx.Context<VS[keyof VS]>,
  Fx.Fx.Error<VS[keyof VS]>,
  { readonly [K in keyof VS]: Fx.Fx.Success<VS[K]> },
  Effect.Effect.Context<VS[keyof VS]>,
  Effect.Effect.Error<VS[keyof VS]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> }
>
```

Added in v1.0.0
