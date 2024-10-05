---
title: Sink.ts
nav_order: 16
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
  <B, A>(f: (b: B) => A): <E, R>(sink: Sink<A, E, R>) => Sink<B, E, R>
  <A, E, R, B>(sink: Sink<A, E, R>, f: (b: B) => A): Sink<B, E, R>
}
```

Added in v1.18.0

# models

## WithEarlyExit (interface)

A Sink which can be utilized to exit early from an Fx.
Useful for operators the end the stream early.

**Signature**

```ts
export interface WithEarlyExit<A, E = never, R = never> extends Sink<A, E, R> {
  readonly earlyExit: Effect.Effect<void>
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
export interface Sink<in A, in E = never, out R = never> {
  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R>
  onSuccess(value: A): Effect.Effect<unknown, never, R>
}
```

Added in v1.20.0

## Sink (namespace)

Added in v1.20.0

### Tagged (interface)

**Signature**

```ts
export interface Tagged<A, E, I> extends Sink<A, E, I> {
  readonly tag: C.Tagged<I, Sink<A, E>>
  readonly make: <R>(sink: Sink<A, E, R>) => Layer.Layer<I, never, R>
}
```

Added in v1.20.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends Sink<infer _A, infer _E, infer R> ? R : never
```

Added in v1.20.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = T extends Sink<infer _A, infer E, infer _R> ? E : never
```

Added in v1.20.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = T extends Sink<infer A, infer _E, infer _R> ? A : never
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
export declare const dropAfter: <A, E, R, R2>(
  sink: Sink<A, E, R>,
  predicate: Predicate.Predicate<A>,
  f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, E, R2>
) => Effect.Effect<void, never, R | R2>
```

Added in v2.0.0

## dropAfterEffect

**Signature**

```ts
export declare const dropAfterEffect: {
  <A, E2, R2>(
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>
  ): <E, R>(sink: Sink<A, E | E2, R>) => Sink<A, E | E2, R | R2>
  <A, E, R, E2, R2>(
    sink: Sink<A, E | E2, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>
  ): Sink<A, E | E2, R | R2>
}
```

Added in v1.20.0

## dropWhile

**Signature**

```ts
export declare const dropWhile: {
  <A>(predicate: Predicate.Predicate<A>): <E, R>(sink: Sink<A, E, R>) => Sink<A, E, R>
  <A, E, R>(sink: Sink<A, E, R>, predicate: Predicate.Predicate<A>): Sink<A, E, R>
}
```

Added in v1.20.0

## dropWhileEffect

**Signature**

```ts
export declare const dropWhileEffect: {
  <A, E2, R2>(
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>
  ): <E, R>(sink: Sink<A, E | E2, R>) => Sink<A, E | E2, R | R2>
  <A, E, R, E2, R2>(
    sink: Sink<A, E | E2, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>
  ): Sink<A, E | E2, R | R2>
}
```

Added in v1.20.0

## filter

**Signature**

```ts
export declare function filter<A, E, R>(sink: Sink<A, E, R>, predicate: Predicate.Predicate<A>): Sink<A, E, R>
```

Added in v1.20.0

## filterEffect

**Signature**

```ts
export declare const filterEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(sink: Sink<A, E | E2, R>) => Sink<A, E | E2, R | R2>
  <A, E, R>(sink: Sink<A, E, R>, f: (a: A) => Effect.Effect<boolean, E, R>): Sink<A, E, R>
}
```

Added in v1.20.0

## filterMap

**Signature**

```ts
export declare function filterMap<A, E, R, B>(sink: Sink<B, E, R>, f: (a: A) => Option.Option<B>): Sink<A, E, R>
```

Added in v1.20.0

## filterMapEffect

**Signature**

```ts
export declare const filterMapEffect: {
  <B, A, E2, R2>(
    f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>
  ): <E, R>(sink: Sink<A, E | E2, R>) => Sink<B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(
    sink: Sink<A, E | E2, R>,
    f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>
  ): Sink<B, E | E2, R | R2>
}
```

Added in v1.20.0

## filterMapLoop

**Signature**

```ts
export declare const filterMapLoop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): <E, R>(sink: Sink<C, E, R>) => Sink<A, E, R>
  <A, E, R, B, C>(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): Sink<A, E, R>
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
  ): <E, R>(sink: Sink<A, C, R>) => Sink<A, E, R>
  <A, E, R, B, C>(
    sink: Sink<A, C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
  ): Sink<A, E, R>
}
```

Added in v1.20.0

## filterMapLoopCauseEffect

**Signature**

```ts
export declare function filterMapLoopCauseEffect<A, E, R, B, E2, R2, C>(
  sink: Sink<A, E2 | C, R>,
  seed: B,
  f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
): Sink<A, E, R | R2>
```

Added in v1.20.0

## filterMapLoopEffect

**Signature**

```ts
export declare const filterMapLoopEffect: {
  <B, A, E2, R2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
  ): <E, R>(sink: Sink<C, E, R>) => Sink<A, E | E2, R | R2>
  <A, E, R, B, R2, C>(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>
  ): Sink<A, E, R | R2>
}
```

Added in v1.20.0

## fromTag

**Signature**

```ts
export declare const fromTag: {
  <S, B, E2, R2>(f: (s: S) => Sink<B, E2, R2>): <I>(tag: C.Tag<I, S>) => Sink<B, E2, I | R2>
  <I, S, B, E2, R2>(tag: C.Tag<I, S>, f: (s: S) => Sink<B, E2, R2>): Sink<B, E2, I | R2>
}
```

Added in v1.20.0

## ignoreInterrupt

**Signature**

```ts
export declare function ignoreInterrupt<A, E, R>(sink: Sink<A, E, R>): Sink<A, E, R>
```

Added in v1.20.0

## loop

**Signature**

```ts
export declare const loop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <E, R>(sink: Sink<C, E, R>) => Sink<A, E, R>
  <A, E, R, B, C>(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Sink<A, E, R>
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
  ): <E, R>(sink: Sink<A, C, R>) => Sink<A, E, R>
  <A, E, R, B, C>(
    sink: Sink<A, C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): Sink<A, E, R>
}
```

Added in v1.20.0

## loopCauseEffect

**Signature**

```ts
export declare const loopCauseEffect: {
  <B, A, E2, R2, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => Effect.Effect<readonly [Cause.Cause<C>, B], E2, R2>
  ): <E, R>(sink: Sink<A, E | C, R>) => Sink<A, E | C, R>
  <A, E, R, B, C>(
    sink: Sink<A, E | C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R>
  ): Sink<A, E | C, R>
}
```

Added in v1.20.0

## loopEffect

**Signature**

```ts
export declare const loopEffect: {
  <B, A, E2, R2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>
  ): <E, R>(sink: Sink<C, E, R>) => Sink<A, E | E2, R | R2>
  <A, E, R, B, C>(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>
  ): Sink<A, E, R>
}
```

Added in v1.20.0

## make

**Signature**

```ts
export declare function make<E, R, A, R2>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<unknown, never, R>,
  onSuccess: (value: A) => Effect.Effect<unknown, never, R2>
): Sink<A, E, R | R2>
```

Added in v1.20.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <B, A, E2, R2>(f: (b: B) => Effect.Effect<A, E2, R2>): <E, R>(sink: Sink<A, E | E2, R>) => Sink<B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(sink: Sink<A, E | E2, R>, f: (b: B) => Effect.Effect<A, E2, R2>): Sink<B, E | E2, R | R2>
}
```

Added in v1.20.0

## provide

**Signature**

```ts
export declare const provide: {
  <R2>(ctx: C.Context<R2>): <A, E, R>(sink: Sink<A, E, R>) => Sink<A, E, Exclude<R, R2>>
  <A, E, R, R2>(sink: Sink<A, E, R>, ctx: C.Context<R2>): Sink<A, E, Exclude<R, R2>>
}
```

Added in v1.20.0

## setSpan

**Signature**

```ts
export declare const setSpan: {
  (span: Tracer.Span): <A, E, R>(sink: Sink<A, E, R>) => Sink<A, E, R>
  <A, E, R>(self: Sink<A, E, R>, span: Tracer.Span): Sink<A, E, R>
}
```

Added in v1.20.0

## slice

**Signature**

```ts
export declare const slice: {
  <A, E, R, R2>(
    bounds: Bounds,
    f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, never, R2>
  ): (sink: Sink<A, E, R>) => Effect.Effect<void, never, R | R2>
  <A, E, R, R2>(
    sink: Sink<A, E, R>,
    bounds: Bounds,
    f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, never, R2>
  ): Effect.Effect<void, never, R | R2>
}
```

Added in v1.20.0

## tagged

**Signature**

```ts
export declare function tagged<E, A>(): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): Sink.Tagged<A, E, C.IdentifierOf<I>>
  <const I>(identifier: I): Sink.Tagged<A, E, C.IdentifierOf<I>>
}
```

Added in v1.20.0

## takeWhile

**Signature**

```ts
export declare const takeWhile: {
  <A, E, R, B, R2>(
    predicate: Predicate.Predicate<A>,
    f: (sink: Sink<A, E, R>) => Effect.Effect<B, E, R2>
  ): (sink: Sink<A, E, R>) => Effect.Effect<void, never, R | R2>
  <A, E, R, B, R2>(
    sink: Sink<A, E, R>,
    predicate: Predicate.Predicate<A>,
    f: (sink: Sink<A, E, R>) => Effect.Effect<B, E, R2>
  ): Effect.Effect<void, never, R | R2>
}
```

Added in v1.20.0

## takeWhileEffect

**Signature**

```ts
export declare const takeWhileEffect: {
  <A, E, R, E2, R2, R3, E3, B>(
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
    f: (sink: Sink<A, E, R | R2>) => Effect.Effect<B, E3, R3>
  ): <E, R>(sink: Sink<A, E, R>) => Effect.Effect<void, never, R | R3>
  <A, E, R, E2, R2, R3, E3, B>(
    sink: Sink<A, E | E2 | E3, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
    f: (sink: Sink<A, E, R | R2>) => Effect.Effect<B, E3, R3>
  ): Effect.Effect<void, never, R | R3>
}
```

Added in v1.20.0

## tapEffect

**Signature**

```ts
export declare const tapEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<unknown, E2, R2>): <E, R>(sink: Sink<A, E | E2, R>) => Sink<A, E | E2, R | R2>
  <A, E, R, E2, R2>(sink: Sink<A, E | E2, R>, f: (a: A) => Effect.Effect<unknown, E2, R2>): Sink<A, E | E2, R | R2>
}
```

Added in v1.20.0

## withEarlyExit

**Signature**

```ts
export declare function withEarlyExit<A, E, R, B, R2>(
  sink: Sink<A, E, R>,
  f: (sink: WithEarlyExit<A, E, R>) => Effect.Effect<B, E, R2>
): Effect.Effect<void, never, R | R2>
```

Added in v1.20.0
