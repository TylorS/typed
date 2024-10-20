---
title: index.ts
nav_order: 1
parent: "@typed/guard"
---

## index overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AnyInput (type alias)](#anyinput-type-alias)
  - [AnyOutput (type alias)](#anyoutput-type-alias)
  - [AsGuard (interface)](#asguard-interface)
  - [Guard (type alias)](#guard-type-alias)
  - [Guard (namespace)](#guard-namespace)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Input (type alias)](#input-type-alias)
    - [Output (type alias)](#output-type-alias)
  - [GuardInput (type alias)](#guardinput-type-alias)
  - [addTag](#addtag)
  - [any](#any)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [catchAll](#catchall)
  - [catchAllCause](#catchallcause)
  - [catchTag](#catchtag)
  - [compose](#compose)
  - [decode](#decode)
  - [encode](#encode)
  - [filter](#filter)
  - [filterMap](#filtermap)
  - [fromSchemaDecode](#fromschemadecode)
  - [fromSchemaEncode](#fromschemaencode)
  - [getGuard](#getguard)
  - [let](#let)
  - [liftPredicate](#liftpredicate)
  - [map](#map)
  - [mapEffect](#mapeffect)
  - [provide](#provide)
  - [provideService](#provideservice)
  - [provideServiceEffect](#provideserviceeffect)
  - [tap](#tap)

---

# utils

## AnyInput (type alias)

**Signature**

```ts
export type AnyInput<GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>> = UnionToIntersection<
  Guard.Input<GS[keyof GS]>
>
```

Added in v1.0.0

## AnyOutput (type alias)

**Signature**

```ts
export type AnyOutput<GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>> = [
  {
    [K in keyof GS]: { readonly _tag: K; readonly value: Guard.Output<GS[K]> }
  }[keyof GS]
] extends [infer R]
  ? R
  : never
```

Added in v1.0.0

## AsGuard (interface)

**Signature**

```ts
export interface AsGuard<in I, out O, out E = never, out R = never> {
  readonly asGuard: () => Guard<I, O, E, R>
}
```

Added in v1.0.0

## Guard (type alias)

**Signature**

```ts
export type Guard<in I, out O, out E = never, out R = never> = (input: I) => Effect.Effect<Option.Option<O>, E, R>
```

Added in v1.0.0

## Guard (namespace)

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = [T] extends [Guard<infer _I, infer _O, infer _E, infer R>]
  ? R
  : [T] extends [AsGuard<infer _I, infer _O, infer _E, infer R>]
    ? R
    : never
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = [T] extends [Guard<infer _I, infer _O, infer E, infer _R>]
  ? E
  : [T] extends [AsGuard<infer _I, infer _O, infer E, infer _R>]
    ? E
    : never
```

Added in v1.0.0

### Input (type alias)

**Signature**

```ts
export type Input<T> = [T] extends [Guard<infer I, infer _R, infer _E, infer _O>]
  ? I
  : [T] extends [AsGuard<infer I, infer _R, infer _E, infer _O>]
    ? I
    : never
```

Added in v1.0.0

### Output (type alias)

**Signature**

```ts
export type Output<T> = [T] extends [Guard<infer _I, infer O, infer _E, infer _R>]
  ? O
  : [T] extends [AsGuard<infer _I, infer O, infer _E, infer _R>]
    ? O
    : never
```

Added in v1.0.0

## GuardInput (type alias)

**Signature**

```ts
export type GuardInput<I, O, E = never, R = never> = Guard<I, O, E, R> | AsGuard<I, O, E, R>
```

Added in v1.0.0

## addTag

**Signature**

```ts
export declare const addTag: {
  <B>(value: B): <I, O, E = never, R = never>(guard: GuardInput<I, O, E, R>) => Guard<I, O & { readonly _tag: B }, E, R>
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, value: B): Guard<I, O & { readonly _tag: B }, E, R>
}
```

Added in v1.0.0

## any

**Signature**

```ts
export declare function any<const GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>>(
  guards: GS
): Guard<AnyInput<GS>, AnyOutput<GS>, Guard.Error<GS[keyof GS]>, Guard.Context<GS[keyof GS]>>
```

Added in v1.0.0

## bind

**Signature**

```ts
export declare const bind: {
  <I, O, E, R, K extends PropertyKey, B, E2, R2>(
    key: K,
    f: GuardInput<O, B, E2, R2>
  ): (guard: GuardInput<I, O, E, R>) => Guard<I, O & { [k in K]: B }, E | E2, R | R2>
  <I, O, E, R, K extends PropertyKey, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    key: K,
    f: GuardInput<O, B, E2, R2>
  ): Guard<I, O & { [k in K]: B }, E | E2, R | R2>
}
```

Added in v1.0.0

## bindTo

**Signature**

```ts
export declare const bindTo: {
  <K extends PropertyKey>(key: K): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, { [k in K]: O }, E, R>
  <I, O, E, R, K extends PropertyKey>(guard: GuardInput<I, O, E, R>, key: K): Guard<I, { [k in K]: O }, E, R>
}
```

Added in v1.0.0

## catchAll

**Signature**

```ts
export declare const catchAll: {
  <E, O2, E2, R2>(
    f: (e: E) => Effect.Effect<O2, E2, R2>
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2, R | R2>
  <I, O, E, R, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (e: E) => Effect.Effect<O2, E2, R2>
  ): Guard<I, O | O2, E2, R | R2>
}
```

Added in v1.0.0

## catchAllCause

**Signature**

```ts
export declare const catchAllCause: {
  <E, O2, E2, R2>(
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2, R | R2>
  <I, O, E, R, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>
  ): Guard<I, O | O2, E2, R | R2>
}
```

Added in v1.0.0

## catchTag

**Signature**

```ts
export declare const catchTag: {
  <E, K extends E extends { _tag: string } ? E["_tag"] : never, O2, E2, R2>(
    tag: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<O2, E2, R2>
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2 | Exclude<E, { _tag: K }>, R | R2>
  <I, O, E, R, K extends E extends { _tag: string } ? E["_tag"] : never, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<O2, E2, R2>
  ): Guard<I, O | O2, E2 | Exclude<E, { _tag: K }>, R | R2>
}
```

Added in v1.0.0

## compose

**Signature**

```ts
export declare const compose: {
  <O, B, E2, R2>(
    output: GuardInput<O, B, E2, R2>
  ): <I, R, E>(input: GuardInput<I, O, E, R>) => Guard<I, B, E | E2, R | R2>
  <I, O, E, R, B, E2, R2>(input: GuardInput<I, O, E, R>, output: GuardInput<O, B, E2, R2>): Guard<I, B, E | E2, R | R2>
}
```

Added in v1.0.0

## decode

**Signature**

```ts
export declare const decode: {
  <A, O, R2>(
    schema: Schema.Schema<A, O, R2>
  ): <I, E = never, R = never>(guard: GuardInput<I, O, E, R>) => Guard<I, A, ParseResult.ParseError | E, R | R2>
  <I, O, E, R, A, R2>(
    guard: GuardInput<I, O, E, R>,
    schema: Schema.Schema<A, O, R2>
  ): Guard<I, A, ParseResult.ParseError | E, R | R2>
}
```

Added in v1.0.0

## encode

**Signature**

```ts
export declare const encode: {
  <O, A, R2>(
    schema: Schema.Schema<O, A, R2>
  ): <I, E = never, R = never>(guard: GuardInput<I, O, E, R>) => Guard<I, A, ParseResult.ParseError | E, R | R2>
  <I, O, E, R, A, R2>(
    guard: GuardInput<I, O, E, R>,
    schema: Schema.Schema<O, A, R2>
  ): Guard<I, A, ParseResult.ParseError | E, R | R2>
}
```

Added in v1.0.0

## filter

**Signature**

```ts
export declare const filter: {
  <O, O2 extends O>(predicate: (o: O) => o is O2): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, R>
  <O>(predicate: (o: O) => boolean): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, R>
  <I, O, E, R, O2 extends O>(guard: GuardInput<I, O, E, R>, predicate: (o: O) => o is O2): Guard<I, O, E, R>
  <I, O, E, R>(guard: GuardInput<I, O, E, R>, predicate: (o: O) => boolean): Guard<I, O, E, R>
}
```

Added in v1.0.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <O, B>(f: (o: O) => Option.Option<B>): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E, R>
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => Option.Option<B>): Guard<I, B, E, R>
}
```

Added in v1.0.0

## fromSchemaDecode

**Signature**

```ts
export declare function fromSchemaDecode<A, I, R>(
  schema: Schema.Schema<A, I, R>
): Guard<I, A, ParseResult.ParseError, R>
```

Added in v1.0.0

## fromSchemaEncode

**Signature**

```ts
export declare function fromSchemaEncode<A, I, R>(
  schema: Schema.Schema<A, I, R>
): Guard<A, I, ParseResult.ParseError, R>
```

Added in v1.0.0

## getGuard

**Signature**

```ts
export declare const getGuard: <I, O, E = never, R = never>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, R>
```

Added in v1.0.0

## let

**Signature**

```ts
export declare const let: {
  <K extends PropertyKey, B>(
    key: K,
    value: B
  ): <I, O, E = never, R = never>(guard: Guard<I, O, E, R>) => Guard<I, O & { [k in K]: B }, E, R>
  <I, O, E, R, K extends PropertyKey, B>(
    guard: Guard<I, O, E, R>,
    key: K,
    value: B
  ): Guard<I, O & { [k in K]: B }, E, R>
}
```

Added in v1.0.0

## liftPredicate

**Signature**

```ts
export declare function liftPredicate<A, B extends A>(predicate: Predicate.Refinement<A, B>): Guard<A, B>
export declare function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A>
```

Added in v1.0.0

## map

**Signature**

```ts
export declare const map: {
  <O, B>(f: (o: O) => B): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E, R>
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => B): Guard<I, B, E, R>
}
```

Added in v1.0.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E | E2, R | R2>
  <I, O, E, R, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): Guard<I, B, E | E2, R | R2>
}
```

Added in v1.0.0

## provide

**Signature**

```ts
export declare const provide: {
  <R2>(provided: Context.Context<R2>): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, R2>>
  <R2>(provided: Runtime.Runtime<R2>): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, R2>>
  <R2, E2, R3>(
    provided: Layer.Layer<R2, E2, R3>
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, Exclude<R, R2> | R3>
  <I, O, E, R, R2>(guard: GuardInput<I, O, E, R>, provided: Context.Context<R2>): Guard<I, O, E, Exclude<R, R2>>
  <I, O, E, R, R2>(guard: GuardInput<I, O, E, R>, provided: Runtime.Runtime<R2>): Guard<I, O, E, Exclude<R, R2>>
  <I, O, E, R, R2, E2, R3>(
    guard: GuardInput<I, O, E, R>,
    provided: Layer.Layer<R2, E2, R3>
  ): Guard<I, O, E | E2, Exclude<R, R2> | R3>
}
```

Added in v1.0.0

## provideService

**Signature**

```ts
export declare const provideService: {
  <Id, S>(
    tag: Context.Tag<Id, S>,
    service: S
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, Id>>
  <I, O, E, R, Id, S>(
    guard: GuardInput<I, O, E, R>,
    tag: Context.Tag<Id, S>,
    service: S
  ): Guard<I, O, E, Exclude<R, Id>>
}
```

Added in v1.0.0

## provideServiceEffect

**Signature**

```ts
export declare const provideServiceEffect: {
  <Id, S, E2, R2>(
    tag: Context.Tag<Id, S>,
    service: Effect.Effect<S, E2, R2>
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, Exclude<R, Id> | R2>
  <I, O, E, R, Id, S, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: Context.Tag<Id, S>,
    service: Effect.Effect<S, E2, R2>
  ): Guard<I, O, E | E2, Exclude<R, Id> | R2>
}
```

Added in v1.0.0

## tap

**Signature**

```ts
export declare const tap: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, R | R2>
  <I, O, E, R, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): Guard<I, O, E | E2, R | R2>
}
```

Added in v1.0.0
