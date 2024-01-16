---
title: Versioned.ts
nav_order: 22
parent: "@typed/fx"
---

## Versioned overview

Versioned is a special Fx which is also an Effect, and keeps track of a version number of the
current value it holds. The Fx portion is used to subscribe to changes, the Effect portion to
sample the current value. The version can be utilized to avoid computing work related to this value.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [map](#map)
  - [mapEffect](#mapeffect)
- [utils](#utils)
  - [Versioned (interface)](#versioned-interface)
  - [Versioned (namespace)](#versioned-namespace)
    - [Unify (type alias)](#unify-type-alias)
    - [VersionContext (type alias)](#versioncontext-type-alias)
    - [VersionError (type alias)](#versionerror-type-alias)
  - [hold](#hold)
  - [make](#make)
  - [multicast](#multicast)
  - [of](#of)
  - [provide](#provide)
  - [replay](#replay)
  - [struct](#struct)
  - [transform](#transform)
  - [tuple](#tuple)

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

# utils

## Versioned (interface)

**Signature**

```ts
export interface Versioned<out R1, out E1, out R2, out E2, out A2, out R3, out E3, out A3>
  extends Fx<R2, E2, A2>,
    Effect.Effect<R3, E3, A3> {
  readonly version: Effect.Effect<R1, E1, number>
}
```

Added in v1.0.0

## Versioned (namespace)

Added in v1.0.0

### Unify (type alias)

**Signature**

```ts
export type Unify<T> = T extends
  | Versioned<infer R1, infer E1, infer R2, infer E2, infer A2, infer R3, infer E3, infer A3>
  | infer _
  ? Versioned<R1, E1, R2, E2, A2, R3, E3, A3>
  : never
```

Added in v1.0.0

### VersionContext (type alias)

**Signature**

```ts
export type VersionContext<T> = T extends Versioned<infer R, any, any, any, any, any, any, any> ? R : never
```

Added in v1.0.0

### VersionError (type alias)

**Signature**

```ts
export type VersionError<T> = T extends Versioned<any, infer E, any, any, any, any, any, any> ? E : never
```

Added in v1.0.0

## hold

**Signature**

```ts
export declare function hold<R0, E0, R, E, A, R2, E2, B>(
  versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
): Versioned<R0, E0, R | Scope.Scope, E, A, R2, E2, B>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<R1, E1, R2, E2, A2, R3, E3, A3>(
  version: Effect.Effect<R1, E1, number>,
  fx: Fx<R2, E2, A2>,
  effect: Effect.Effect<R3, E3, A3>
): Versioned<R1, E1, R2, E2, A2, R3, E3, A3>
```

Added in v1.0.0

## multicast

**Signature**

```ts
export declare function multicast<R0, E0, R, E, A, R2, E2, B>(
  versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
): Versioned<R0, E0, R | Scope.Scope, E, A, R2, E2, B>
```

Added in v1.0.0

## of

**Signature**

```ts
export declare function of<A>(value: A): Versioned<never, never, never, never, A, never, never, A>
```

Added in v1.0.0

## provide

**Signature**

```ts
export declare const provide: {
  <S>(
    ctx: Context.Context<S> | Runtime.Runtime<S>
  ): <R0, E0, R, E, A, R2, E2, B>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<Exclude<R0, S>, E0, Exclude<R, S>, E, A, Exclude<R2, S>, E2, B>
  <R3, S>(
    layer: Layer.Layer<R3, never, S>
  ): <R0, E0, R, E, A, R2, E2, B>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<R3 | Exclude<R0, S>, E0, R3 | Exclude<R, S>, E, A, R3 | Exclude<R2, S>, E2, B>
  <R0, E0, R, E, A, R2, E2, B, S>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    context: Context.Context<S> | Runtime.Runtime<S>
  ): Versioned<Exclude<R0, S>, E0, Exclude<R, S>, E, A, Exclude<R2, S>, E2, B>
  <R0, E0, R, E, A, R2, E2, B, R3 = never, S = never>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    context: Layer.Layer<R3, never, S>
  ): Versioned<R3 | Exclude<R0, S>, E0, R3 | Exclude<R, S>, E, A, R3 | Exclude<R2, S>, E2, B>
  <R0, E0, R, E, A, R2, E2, B, R3 = never, S = never>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    context: Context.Context<S> | Runtime.Runtime<S> | Layer.Layer<R3, never, S>
  ): Versioned<R3 | Exclude<R0, S>, E0, R3 | Exclude<R, S>, E, A, R3 | Exclude<R2, S>, E2, B>
}
```

Added in v1.0.0

## replay

**Signature**

```ts
export declare function replay<R0, E0, R, E, A, R2, E2, B>(
  versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
  bufferSize: number
): Versioned<R0, E0, R | Scope.Scope, E, A, R2, E2, B>
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
  Fx.Context<VS[keyof VS]>,
  Fx.Error<VS[keyof VS]>,
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Effect.Effect.Context<VS[keyof VS]>,
  Effect.Effect.Error<VS[keyof VS]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> }
>
```

Added in v1.0.0

## transform

**Signature**

```ts
export declare function transform<R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
  input: Versioned<R0, E0, R, E, A, R2, E2, B>,
  transformFx: (fx: Fx<R, E, A>) => Fx<R3, E3, C>,
  transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
): Versioned<never, never, R3, E3, C, R0 | R4, E0 | E4, D>
```

Added in v1.0.0

## tuple

**Signature**

```ts
export declare function tuple<const VS extends ReadonlyArray<Versioned<any, any, any, any, any, any, any, any>>>(
  versioneds: VS
): Versioned<
  Versioned.VersionContext<VS[number]>,
  Versioned.VersionError<VS[number]>,
  Fx.Context<VS[number]>,
  Fx.Error<VS[number]>,
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Effect.Effect.Context<VS[number]>,
  Effect.Effect.Error<VS[number]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> }
>
```

Added in v1.0.0
