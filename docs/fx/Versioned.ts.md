---
title: Versioned.ts
nav_order: 21
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
  <A, E, R, C, B, D>(options: {
    onFx: (a: A) => C
    onEffect: (b: B) => D
  }): <R0, E0, R2, E2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
  ) => Versioned<never, never, C, E, R, D, E0 | E2, R0 | R2>
  <R0, E0, A, E, R, B, E2, R2, C, D>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: { onFx: (a: A) => C; onEffect: (b: B) => D }
  ): Versioned<never, never, C, E, R, D, E0 | E2, R0 | R2>
}
```

Added in v1.18.0

## mapEffect

Transform a Versioned's output value as both an Fx and Effect using an Effect.

**Signature**

```ts
export declare const mapEffect: {
  <A, C, E3, R3, B, D, E4, R4>(options: {
    onFx: (a: A) => Effect.Effect<C, E3, R3>
    onEffect: (b: B) => Effect.Effect<D, E4, R4>
  }): <R0, E0, R, E, R2, E2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
  ) => Versioned<never, never, C, E | E3, R | R3, D, E0 | E2 | E4, R0 | R2 | R4>
  <R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: { onFx: (a: A) => Effect.Effect<C, E3, R3>; onEffect: (b: B) => Effect.Effect<D, E4, R4> }
  ): Versioned<never, never, C, E | E3, R | R3, D, E0 | E2 | E4, R0 | R2 | R4>
}
```

Added in v1.18.0

# utils

## Versioned (interface)

**Signature**

```ts
export interface Versioned<out R1, out E1, out A2, out E2, out R2, out A3, out E3, out R3>
  extends Fx<A2, E2, R2>,
    Effect.Effect<A3, E3, R3> {
  readonly version: Effect.Effect<number, E1, R1>
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
  ? Versioned<R1, E1, A2, E2, R2, A3, E3, R3>
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
export declare function hold<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
): Versioned<R0, E0, A, E, R | Scope.Scope, B, E2, R2>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<R1, E1, A2, E2, R2, A3, E3, R3>(
  version: Effect.Effect<number, E1, R1>,
  fx: Fx<A2, E2, R2>,
  effect: Effect.Effect<A3, E3, R3>
): Versioned<R1, E1, A2, E2, R2, A3, E3, R3>
```

Added in v1.0.0

## multicast

**Signature**

```ts
export declare function multicast<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
): Versioned<R0, E0, A, E, R | Scope.Scope, B, E2, R2>
```

Added in v1.0.0

## of

**Signature**

```ts
export declare function of<A>(value: A): Versioned<never, never, A, never, never, A, never, never>
```

Added in v1.0.0

## provide

**Signature**

```ts
export declare const provide: {
  <S>(
    ctx: Context.Context<S> | Runtime.Runtime<S>
  ): <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
  ) => Versioned<Exclude<R0, S>, E0, A, E, Exclude<R, S>, B, E2, Exclude<R2, S>>
  <R3, S>(
    layer: Layer.Layer<S, never, R3>
  ): <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
  ) => Versioned<R3 | Exclude<R0, S>, E0, A, E, R3 | Exclude<R, S>, B, E2, R3 | Exclude<R2, S>>
  <R0, E0, A, E, R, B, E2, R2, S>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    context: Context.Context<S> | Runtime.Runtime<S>
  ): Versioned<Exclude<R0, S>, E0, A, E, Exclude<R, S>, B, E2, Exclude<R2, S>>
  <R0, E0, A, E, R, B, E2, R2, R3 = never, S = never>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    context: Layer.Layer<S, never, R3>
  ): Versioned<R3 | Exclude<R0, S>, E0, A, E, R3 | Exclude<R, S>, B, E2, R3 | Exclude<R2, S>>
  <R0, E0, A, E, R, B, E2, R2, R3 = never, S = never>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    context: Context.Context<S> | Runtime.Runtime<S> | Layer.Layer<S, never, R3>
  ): Versioned<R3 | Exclude<R0, S>, E0, A, E, R3 | Exclude<R, S>, B, E2, R3 | Exclude<R2, S>>
}
```

Added in v1.0.0

## replay

**Signature**

```ts
export declare function replay<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  bufferSize: number
): Versioned<R0, E0, A, E, R | Scope.Scope, B, E2, R2>
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
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Fx.Error<VS[keyof VS]>,
  Fx.Context<VS[keyof VS]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> },
  Effect.Effect.Error<VS[keyof VS]>,
  Effect.Effect.Context<VS[keyof VS]>
>
```

Added in v1.0.0

## transform

**Signature**

```ts
export declare function transform<R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
  input: Versioned<R0, E0, A, E, R, B, E2, R2>,
  transformFx: (fx: Fx<A, E, R>) => Fx<C, E3, R3>,
  transformGet: (effect: Effect.Effect<B, E2, R2>) => Effect.Effect<D, E4, R4>
): Versioned<never, never, C, E3, R3, D, E0 | E4, R0 | R4>
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
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> },
  Fx.Error<VS[number]>,
  Fx.Context<VS[number]>,
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Effect.Effect.Error<VS[number]>,
  Effect.Effect.Context<VS[number]>
>
```

Added in v1.0.0
