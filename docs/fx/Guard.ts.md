---
title: Guard.ts
nav_order: 6
parent: "@typed/fx"
---

## Guard overview

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AnyInput (type alias)](#anyinput-type-alias)
  - [AnyOutput (type alias)](#anyoutput-type-alias)
  - [Guard (type alias)](#guard-type-alias)
  - [Guard (namespace)](#guard-namespace)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Input (type alias)](#input-type-alias)
    - [Output (type alias)](#output-type-alias)
  - [any](#any)
  - [compose](#compose)
  - [filter](#filter)
  - [filterMap](#filtermap)
  - [liftPredicate](#liftpredicate)
  - [map](#map)
  - [mapEffect](#mapeffect)
  - [tap](#tap)

---

# utils

## AnyInput (type alias)

**Signature**

```ts
export type AnyInput<GS extends Readonly<Record<string, Guard<any, any, any, any>>>> = UnionToIntersection<
  Guard.Input<GS[keyof GS]>
>
```

Added in v1.18.0

## AnyOutput (type alias)

**Signature**

```ts
export type AnyOutput<GS extends Readonly<Record<string, Guard<any, any, any, any>>>> = [
  {
    [K in keyof GS]: { readonly _tag: K; readonly value: Guard.Output<GS[K]> }
  }[keyof GS]
] extends [infer R]
  ? R
  : never
```

Added in v1.18.0

## Guard (type alias)

**Signature**

```ts
export type Guard<I, R, E, O> = (input: I) => Effect.Effect<R, E, Option.Option<O>>
```

Added in v1.18.0

## Guard (namespace)

Added in v1.18.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends Guard<infer _I, infer R, infer _E, infer _O> ? R : never
```

Added in v1.18.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = T extends Guard<infer _I, infer _R, infer E, infer _O> ? E : never
```

Added in v1.18.0

### Input (type alias)

**Signature**

```ts
export type Input<T> = T extends Guard<infer I, infer _R, infer _E, infer _O> ? I : never
```

Added in v1.18.0

### Output (type alias)

**Signature**

```ts
export type Output<T> = T extends Guard<infer _I, infer _R, infer _E, infer O> ? O : never
```

Added in v1.18.0

## any

**Signature**

```ts
export declare function any<const GS extends Readonly<Record<string, Guard<any, any, any, any>>>>(
  guards: GS
): Guard<AnyInput<GS>, Guard.Context<GS[keyof GS]>, Guard.Context<GS[keyof GS]>, AnyOutput<GS>>
```

Added in v1.18.0

## compose

**Signature**

```ts
export declare const compose: {
  <O, R2, E2, B>(output: Guard<O, R2, E2, B>): <I, R, E>(input: Guard<I, R, E, O>) => Guard<I, R2 | R, E2 | E, B>
  <I, R, E, O, R2, E2, B>(input: Guard<I, R, E, O>, output: Guard<O, R2, E2, B>): Guard<I, R | R2, E | E2, B>
}
```

Added in v1.18.0

## filter

**Signature**

```ts
export declare const filter: {
  <O, O2 extends O>(predicate: (o: O) => o is O2): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, O2>
  <O>(predicate: (o: O) => boolean): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, O>
  <I, R, E, O, O2 extends O>(guard: Guard<I, R, E, O>, predicate: (o: O) => o is O2): Guard<I, R, E, O2>
  <I, R, E, O>(guard: Guard<I, R, E, O>, predicate: (o: O) => boolean): Guard<I, R, E, O>
}
```

Added in v1.18.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <O, B>(f: (o: O) => Option.Option<B>): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, B>
  <I, R, E, O, B>(guard: Guard<I, R, E, O>, f: (o: O) => Option.Option<B>): Guard<I, R, E, B>
}
```

Added in v1.18.0

## liftPredicate

**Signature**

```ts
export declare function liftPredicate<A, B extends A>(predicate: Predicate.Refinement<A, B>): Guard<A, never, never, B>
export declare function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, never, never, A>
```

Added in v1.20.0

## map

**Signature**

```ts
export declare const map: {
  <O, B>(f: (o: O) => B): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, B>
  <I, R, E, O, B>(guard: Guard<I, R, E, O>, f: (o: O) => B): Guard<I, R, E, B>
}
```

Added in v1.18.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <O, R2, E2, B>(
    f: (o: O) => Effect.Effect<R2, E2, B>
  ): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R2 | R, E2 | E, B>
  <I, R, E, O, R2, E2, B>(guard: Guard<I, R, E, O>, f: (o: O) => Effect.Effect<R2, E2, B>): Guard<I, R | R2, E | E2, B>
}
```

Added in v1.18.0

## tap

**Signature**

```ts
export declare const tap: {
  <O, R2, E2, B>(
    f: (o: O) => Effect.Effect<R2, E2, B>
  ): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R2 | R, E2 | E, O>
  <I, R, E, O, R2, E2, B>(guard: Guard<I, R, E, O>, f: (o: O) => Effect.Effect<R2, E2, B>): Guard<I, R | R2, E | E2, O>
}
```

Added in v1.18.0
