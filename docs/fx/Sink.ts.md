---
title: Sink.ts
nav_order: 17
parent: "@typed/fx"
---

## Sink overview

Sink is a data structure which can be used to consume values from a stream.

Added in v1.20.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [map](#map)
- [models](#models)
  - [WithEarlyExit (interface)](#withearlyexit-interface)
- [utils](#utils)
  - [Context (type alias)](#context-type-alias)
  - [Error (type alias)](#error-type-alias)
  - [Sink (interface)](#sink-interface)
  - [Sink (namespace)](#sink-namespace)
    - [Tagged (interface)](#tagged-interface)
    - [Context (type alias)](#context-type-alias-1)
    - [Error (type alias)](#error-type-alias-1)
    - [Success (type alias)](#success-type-alias)
  - [Success (type alias)](#success-type-alias-1)
  - [dropAfter](#dropafter)
  - [dropAfterEffect](#dropaftereffect)
  - [dropWhile](#dropwhile)
  - [dropWhileEffect](#dropwhileeffect)
  - [filter](#filter)
  - [filterEffect](#filtereffect)
  - [filterMap](#filtermap)
  - [filterMapEffect](#filtermapeffect)
  - [filterMapLoop](#filtermaploop)
  - [filterMapLoopCause](#filtermaploopcause)
  - [filterMapLoopCauseEffect](#filtermaploopcauseeffect)
  - [filterMapLoopEffect](#filtermaploopeffect)
  - [fromTag](#fromtag)
  - [ignoreInterrupt](#ignoreinterrupt)
  - [loop](#loop)
  - [loopCause](#loopcause)
  - [loopCauseEffect](#loopcauseeffect)
  - [loopEffect](#loopeffect)
  - [make](#make)
  - [mapEffect](#mapeffect)
  - [provide](#provide)
  - [setSpan](#setspan)
  - [slice](#slice)
  - [tagged](#tagged)
  - [takeWhile](#takewhile)
  - [takeWhileEffect](#takewhileeffect)
  - [tapEffect](#tapeffect)
  - [withEarlyExit](#withearlyexit)

---

# combinators

## map

Transform the input value of a Sink.

**Signature**

```ts
export declare const map: {
  <B, A>(f: (b: B) => A): <R, E>(sink: Sink<R, E, A>) => Sink<R, E, B>
  <R, E, A, B>(sink: Sink<R, E, A>, f: (b: B) => A): Sink<R, E, B>
}
```

Added in v1.18.0

# models

## WithEarlyExit (interface)

A Sink which can be utilized to exit early from an Fx.
Useful for operators the end the stream early.

**Signature**

```ts
export interface WithEarlyExit<R, E, A> extends Sink<R, E, A> {
  readonly earlyExit: Effect.Effect<never, never, void>
}
```

Added in v1.18.0

# utils

## Context (type alias)

**Signature**

```ts
export type Context<T> = Sink.Context<T>
```

Added in v1.20.0

## Error (type alias)

**Signature**

```ts
export type Error<T> = Sink.Error<T>
```

Added in v1.20.0

## Sink (interface)

Sink is a data structure which can be used to consume values from a stream.

**Signature**

```ts
export interface Sink<out R, in E, in A> {
  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown>
  onSuccess(value: A): Effect.Effect<R, never, unknown>
}
```

Added in v1.20.0

## Sink (namespace)

Added in v1.20.0

### Tagged (interface)

**Signature**

```ts
export interface Tagged<I, E, A> extends Sink<I, E, A> {
  readonly tag: C.Tagged<I, Sink<never, E, A>>
  readonly make: <R>(sink: Sink<R, E, A>) => Layer.Layer<R, never, I>
}
```

Added in v1.20.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends Sink<infer R, infer _E, infer _A> ? R : never
```

Added in v1.20.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = T extends Sink<infer _R, infer E, infer _A> ? E : never
```

Added in v1.20.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = T extends Sink<infer _R, infer _E, infer A> ? A : never
```

Added in v1.20.0

## Success (type alias)

**Signature**

```ts
export type Success<T> = Sink.Success<T>
```

Added in v1.20.0

## dropAfter

**Signature**

```ts
export declare const dropAfter: {
  <A>(predicate: Predicate.Predicate<A>): <R, E>(sink: Sink<R, E, A>) => Sink<R, E, A>
  <R, E, A>(sink: Sink<R, E, A>, predicate: Predicate.Predicate<A>): Sink<R, E, A>
}
```

Added in v1.20.0

## dropAfterEffect

**Signature**

```ts
export declare const dropAfterEffect: {
  <A, R2, E2>(
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): <R, E>(sink: Sink<R, E2 | E, A>) => Sink<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(
    sink: Sink<R, E | E2, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Sink<R | R2, E | E2, A>
}
```

Added in v1.20.0

## dropWhile

**Signature**

```ts
export declare const dropWhile: {
  <A>(predicate: Predicate.Predicate<A>): <R, E>(sink: Sink<R, E, A>) => Sink<R, E, A>
  <R, E, A>(sink: Sink<R, E, A>, predicate: Predicate.Predicate<A>): Sink<R, E, A>
}
```

Added in v1.20.0

## dropWhileEffect

**Signature**

```ts
export declare const dropWhileEffect: {
  <A, R2, E2>(
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): <R, E>(sink: Sink<R, E2 | E, A>) => Sink<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(
    sink: Sink<R, E | E2, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Sink<R | R2, E | E2, A>
}
```

Added in v1.20.0

## filter

**Signature**

```ts
export declare function filter<R, E, A>(sink: Sink<R, E, A>, predicate: Predicate.Predicate<A>): Sink<R, E, A>
```

Added in v1.20.0

## filterEffect

**Signature**

```ts
export declare const filterEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(sink: Sink<R, E2 | E, A>) => Sink<R2 | R, E2 | E, A>
  <R, E, A>(sink: Sink<R, E, A>, f: (a: A) => Effect.Effect<R, E, boolean>): Sink<R, E, A>
}
```

Added in v1.20.0

## filterMap

**Signature**

```ts
export declare function filterMap<R, E, A, B>(sink: Sink<R, E, B>, f: (a: A) => Option.Option<B>): Sink<R, E, A>
```

Added in v1.20.0

## filterMapEffect

**Signature**

```ts
export declare const filterMapEffect: {
  <B, R2, E2, A>(
    f: (b: B) => Effect.Effect<R2, E2, Option.Option<A>>
  ): <R, E>(sink: Sink<R, E2 | E, A>) => Sink<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    sink: Sink<R, E | E2, A>,
    f: (b: B) => Effect.Effect<R2, E2, Option.Option<A>>
  ): Sink<R | R2, E | E2, B>
}
```

Added in v1.20.0

## filterMapLoop

**Signature**

```ts
export declare const filterMapLoop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): <R, E>(sink: Sink<R, E, C>) => Sink<R, E, A>
  <R, E, A, B, C>(sink: Sink<R, E, C>, seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): Sink<R, E, A>
}
```

Added in v1.20.0

## filterMapLoopCause

**Signature**

```ts
export declare const filterMapLoopCause: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => readonly [Option.Option<Cause.Cause<C>>, B]
  ): <R, E>(sink: Sink<R, C, A>) => Sink<R, E, A>
  <R, E, A, B, C>(
    sink: Sink<R, C, A>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
  ): Sink<R, E, A>
}
```

Added in v1.20.0

## filterMapLoopCauseEffect

**Signature**

```ts
export declare function filterMapLoopCauseEffect<R, E, A, B, R2, E2, C>(
  sink: Sink<R, E2 | C, A>,
  seed: B,
  f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Option.Option<Cause.Cause<C>>, B]>
): Sink<R | R2, E, A>
```

Added in v1.20.0

## filterMapLoopEffect

**Signature**

```ts
export declare const filterMapLoopEffect: {
  <B, A, R2, E2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
  ): <R, E>(sink: Sink<R, E, C>) => Sink<R2 | R, E2 | E, A>
  <R, E, A, B, R2, C>(
    sink: Sink<R, E, C>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E, readonly [Option.Option<C>, B]>
  ): Sink<R | R2, E, A>
}
```

Added in v1.20.0

## fromTag

**Signature**

```ts
export declare const fromTag: {
  <S, R2, E2, B>(f: (s: S) => Sink<R2, E2, B>): <I>(tag: C.Tag<I, S>) => Sink<R2 | I, E2, B>
  <I, S, R2, E2, B>(tag: C.Tag<I, S>, f: (s: S) => Sink<R2, E2, B>): Sink<I | R2, E2, B>
}
```

Added in v1.20.0

## ignoreInterrupt

**Signature**

```ts
export declare function ignoreInterrupt<R, E, A>(sink: Sink<R, E, A>): Sink<R, E, A>
```

Added in v1.20.0

## loop

**Signature**

```ts
export declare const loop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <R, E>(sink: Sink<R, E, C>) => Sink<R, E, A>
  <R, E, A, B, C>(sink: Sink<R, E, C>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Sink<R, E, A>
}
```

Added in v1.20.0

## loopCause

**Signature**

```ts
export declare const loopCause: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => readonly [Cause.Cause<C>, B]
  ): <R, E>(sink: Sink<R, C, A>) => Sink<R, E, A>
  <R, E, A, B, C>(
    sink: Sink<R, C, A>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): Sink<R, E, A>
}
```

Added in v1.20.0

## loopCauseEffect

**Signature**

```ts
export declare const loopCauseEffect: {
  <B, A, R2, E2, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => Effect.Effect<R2, E2, readonly [Cause.Cause<C>, B]>
  ): <R, E>(sink: Sink<R, C | E, A>) => Sink<R, C | E, A>
  <R, E, A, B, C>(
    sink: Sink<R, E | C, A>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<R, E, readonly [Cause.Cause<C>, B]>
  ): Sink<R, E | C, A>
}
```

Added in v1.20.0

## loopEffect

**Signature**

```ts
export declare const loopEffect: {
  <B, A, R2, E2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  ): <R, E>(sink: Sink<R, E, C>) => Sink<R2 | R, E2 | E, A>
  <R, E, A, B, C>(
    sink: Sink<R, E, C>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R, E, readonly [C, B]>
  ): Sink<R, E, A>
}
```

Added in v1.20.0

## make

**Signature**

```ts
export declare function make<E, R, A, R2>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>,
  onSuccess: (value: A) => Effect.Effect<R2, never, unknown>
): Sink<R | R2, E, A>
```

Added in v1.20.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <B, R2, E2, A>(f: (b: B) => Effect.Effect<R2, E2, A>): <R, E>(sink: Sink<R, E2 | E, A>) => Sink<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(sink: Sink<R, E | E2, A>, f: (b: B) => Effect.Effect<R2, E2, A>): Sink<R | R2, E | E2, B>
}
```

Added in v1.20.0

## provide

**Signature**

```ts
export declare const provide: {
  <R2>(ctx: C.Context<R2>): <R, E, A>(sink: Sink<R, E, A>) => Sink<Exclude<R, R2>, E, A>
  <R, E, A, R2>(sink: Sink<R, E, A>, ctx: C.Context<R2>): Sink<Exclude<R, R2>, E, A>
}
```

Added in v1.20.0

## setSpan

**Signature**

```ts
export declare const setSpan: {
  (span: Tracer.Span): <R, E, A>(sink: Sink<R, E, A>) => Sink<R, E, A>
  <R, E, A>(self: Sink<R, E, A>, span: Tracer.Span): Sink<R, E, A>
}
```

Added in v1.20.0

## slice

**Signature**

```ts
export declare const slice: {
  <R, E, A, R2>(
    bounds: Bounds,
    f: (sink: Sink<R, E, A>) => Effect.Effect<R2, never, unknown>
  ): (sink: Sink<R, E, A>) => Effect.Effect<R | R2, never, void>
  <R, E, A, R2>(
    sink: Sink<R, E, A>,
    bounds: Bounds,
    f: (sink: Sink<R, E, A>) => Effect.Effect<R2, never, unknown>
  ): Effect.Effect<R | R2, never, void>
}
```

Added in v1.20.0

## tagged

**Signature**

```ts
export declare function tagged<E, A>(): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): Sink.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I): Sink.Tagged<C.IdentifierOf<I>, E, A>
}
```

Added in v1.20.0

## takeWhile

**Signature**

```ts
export declare const takeWhile: {
  <R, E, A, R2, B>(
    predicate: Predicate.Predicate<A>,
    f: (sink: Sink<R, E, A>) => Effect.Effect<R2, E, B>
  ): (sink: Sink<R, E, A>) => Effect.Effect<R | R2, never, void>
  <R, E, A, R2, B>(
    sink: Sink<R, E, A>,
    predicate: Predicate.Predicate<A>,
    f: (sink: Sink<R, E, A>) => Effect.Effect<R2, E, B>
  ): Effect.Effect<R | R2, never, void>
}
```

Added in v1.20.0

## takeWhileEffect

**Signature**

```ts
export declare const takeWhileEffect: {
  <R, E, A, R2, E2, R3, E3, B>(
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>,
    f: (sink: Sink<R | R2, E, A>) => Effect.Effect<R3, E3, B>
  ): <R, E>(sink: Sink<R, E, A>) => Effect.Effect<R3 | R, never, void>
  <R, E, A, R2, E2, R3, E3, B>(
    sink: Sink<R, E | E2 | E3, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>,
    f: (sink: Sink<R | R2, E, A>) => Effect.Effect<R3, E3, B>
  ): Effect.Effect<R | R3, never, void>
}
```

Added in v1.20.0

## tapEffect

**Signature**

```ts
export declare const tapEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, unknown>): <R, E>(sink: Sink<R, E2 | E, A>) => Sink<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(sink: Sink<R, E | E2, A>, f: (a: A) => Effect.Effect<R2, E2, unknown>): Sink<R | R2, E | E2, A>
}
```

Added in v1.20.0

## withEarlyExit

**Signature**

```ts
export declare function withEarlyExit<R, E, A, R2, B>(
  sink: Sink<R, E, A>,
  f: (sink: WithEarlyExit<R, E, A>) => Effect.Effect<R2, E, B>
): Effect.Effect<R | R2, never, void>
```

Added in v1.20.0
