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
export type Guard<in I, out O, out E = never, out R = never> = (input: I) => Effect.Effect<Option.Option<O>, E, R>
```

Added in v1.18.0

## Guard (namespace)

Added in v1.18.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends Guard<infer _I, infer _O, infer _E, infer R> ? R : never
```

Added in v1.18.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = T extends Guard<infer _I, infer _O, infer E, infer _R> ? E : never
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
export type Output<T> = T extends Guard<infer _I, infer O, infer _E, infer _R> ? O : never
```

Added in v1.18.0

## any

**Signature**

```ts
export declare function any<const GS extends Readonly<Record<string, Guard<any, any, any, any>>>>(
  guards: GS
): Guard<AnyInput<GS>, AnyOutput<GS>, Guard.Error<GS[keyof GS]>, Guard.Context<GS[keyof GS]>>
```

Added in v1.18.0

## compose

**Signature**

```ts
export declare const compose: {
  <O, B, E2, R2>(output: Guard<O, B, E2, R2>): <I, R, E>(input: Guard<I, O, E, R>) => Guard<I, B, E2 | E, R2 | R>
  <I, O, E, R, B, E2, R2>(input: Guard<I, O, E, R>, output: Guard<O, B, E2, R2>): Guard<I, B, E | E2, R | R2>
}
```

Added in v1.18.0

## filter

**Signature**

```ts
export declare const filter: {
  <O, O2 extends O>(predicate: (o: O) => o is O2): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, O, E, R>
  <O>(predicate: (o: O) => boolean): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, O, E, R>
  <I, O, E, R, O2 extends O>(guard: Guard<I, O, E, R>, predicate: (o: O) => o is O2): Guard<I, O, E, R>
  <I, O, E, R>(guard: Guard<I, O, E, R>, predicate: (o: O) => boolean): Guard<I, O, E, R>
}
```

Added in v1.18.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <O, B>(f: (o: O) => Option.Option<B>): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, B, E, R>
  <I, O, E, R, B>(guard: Guard<I, O, E, R>, f: (o: O) => Option.Option<B>): Guard<I, B, E, R>
}
```

Added in v1.18.0

## liftPredicate

**Signature**

```ts
export declare function liftPredicate<A, B extends A>(predicate: Predicate.Refinement<A, B>): Guard<A, B>
export declare function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A>
```

Added in v1.20.0

## map

**Signature**

```ts
export declare const map: {
  <O, B>(f: (o: O) => B): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, B, E, R>
  <I, O, E, R, B>(guard: Guard<I, O, E, R>, f: (o: O) => B): Guard<I, B, E, R>
}
```

Added in v1.18.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, B, E2 | E, R2 | R>
  <I, O, E, R, B, E2, R2>(guard: Guard<I, O, E, R>, f: (o: O) => Effect.Effect<B, E2, R2>): Guard<I, B, E | E2, R | R2>
}
```

Added in v1.18.0

## tap

**Signature**

```ts
export declare const tap: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, O, E2 | E, R2 | R>
  <I, O, E, R, B, E2, R2>(guard: Guard<I, O, E, R>, f: (o: O) => Effect.Effect<B, E2, R2>): Guard<I, O, E | E2, R | R2>
}
```

Added in v1.18.0
