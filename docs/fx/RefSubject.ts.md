---
title: RefSubject.ts
nav_order: 16
parent: "@typed/fx"
---

## RefSubject overview

A RefSubject is a Subject that can be used to read and write a value.

Added in v1.20.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Computed (interface)](#computed-interface)
  - [Computed (namespace)](#computed-namespace)
    - [Any (type alias)](#any-type-alias)
  - [Context (type alias)](#context-type-alias)
  - [Error (type alias)](#error-type-alias)
  - [Filtered (interface)](#filtered-interface)
  - [Filtered (namespace)](#filtered-namespace)
    - [Any (type alias)](#any-type-alias-1)
  - [GetSetDelete (interface)](#getsetdelete-interface)
  - [GetStructKind (type alias)](#getstructkind-type-alias)
  - [GetTupleKind (type alias)](#gettuplekind-type-alias)
  - [MatchKind (type alias)](#matchkind-type-alias)
  - [RefSubject (interface)](#refsubject-interface)
  - [RefSubject (namespace)](#refsubject-namespace)
    - [Derived (interface)](#derived-interface)
    - [Tagged (interface)](#tagged-interface)
    - [Any (type alias)](#any-type-alias-2)
  - [RefSubjectOptions (interface)](#refsubjectoptions-interface)
  - [Success (type alias)](#success-type-alias)
  - [TupleFrom (type alias)](#tuplefrom-type-alias)
  - [asFalse](#asfalse)
  - [asTrue](#astrue)
  - [compact](#compact)
  - [computedFromTag](#computedfromtag)
  - [decrement](#decrement)
  - [delete](#delete)
  - [drop](#drop)
  - [filter](#filter)
  - [filterEffect](#filtereffect)
  - [filterMap](#filtermap)
  - [filterMapEffect](#filtermapeffect)
  - [filteredFromTag](#filteredfromtag)
  - [fromEffect](#fromeffect)
  - [fromFx](#fromfx)
  - [fromRefSubject](#fromrefsubject)
  - [fromTag](#fromtag)
  - [increment](#increment)
  - [isComputed](#iscomputed)
  - [isDerived](#isderived)
  - [isFiltered](#isfiltered)
  - [isRefSubject](#isrefsubject)
  - [make](#make)
  - [map](#map)
  - [mapEffect](#mapeffect)
  - [modify](#modify)
  - [modifyEffect](#modifyeffect)
  - [of](#of)
  - [provide](#provide)
  - [reset](#reset)
  - [runUpdates](#runupdates)
  - [set](#set)
  - [skipRepeats](#skiprepeats)
  - [skipRepeatsWith](#skiprepeatswith)
  - [slice](#slice)
  - [struct](#struct)
  - [tagged](#tagged)
  - [take](#take)
  - [toggle](#toggle)
  - [transform](#transform)
  - [transformOrFail](#transformorfail)
  - [tuple](#tuple)
  - [unsafeMake](#unsafemake)
  - [update](#update)
  - [updateEffect](#updateeffect)

---

# utils

## Computed (interface)

A Computed is essentially a readonly RefSubject.

**Signature**

```ts
export interface Computed<out R, out E, out A> extends Versioned.Versioned<R, E, R | Scope.Scope, E, A, R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId
}
```

Added in v1.20.0

## Computed (namespace)

Added in v1.20.0

### Any (type alias)

**Signature**

```ts
export type Any =
  | Computed<any, any, any>
  | Computed<never, any, any>
  | Computed<any, never, any>
  | Computed<never, never, any>
```

Added in v1.20.0

## Context (type alias)

**Signature**

```ts
export type Context<T> = Fx.Context<T>
```

Added in v1.20.0

## Error (type alias)

**Signature**

```ts
export type Error<T> = Fx.Error<T>
```

Added in v1.20.0

## Filtered (interface)

A Filtered is essentially a readonly RefSubject that may have its values filtered out.

**Signature**

```ts
export interface Filtered<out R, out E, out A>
  extends Versioned.Versioned<R, E, R | Scope.Scope, E, A, R, E | Cause.NoSuchElementException, A> {
  readonly [FilteredTypeId]: FilteredTypeId

  /**
   * @since 1.20.0
   */
  asComputed(): Computed<R, E, Option.Option<A>>
}
```

Added in v1.20.0

## Filtered (namespace)

Added in v1.20.0

### Any (type alias)

**Signature**

```ts
export type Any =
  | Filtered<any, any, any>
  | Filtered<never, any, any>
  | Filtered<any, never, any>
  | Filtered<never, never, any>
```

Added in v1.20.0

## GetSetDelete (interface)

**Signature**

```ts
export interface GetSetDelete<R, E, A> {
  /**
   * @since 1.20.0
   */
  readonly get: Effect.Effect<R, E, A>
  /**
   * @since 1.20.0
   */
  readonly set: (a: A) => Effect.Effect<R, never, A>
  /**
   * @since 1.20.0
   */
  readonly delete: Effect.Effect<R, E, Option.Option<A>>
}
```

Added in v1.20.0

## GetStructKind (type alias)

**Signature**

```ts
export type GetStructKind<Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>> =
  MergeKinds<
    UnionToTuple<
      {
        [K in keyof Refs]: MatchKind<Refs[K]>
      }[keyof Refs]
    >
  >
```

Added in v1.20.0

## GetTupleKind (type alias)

**Signature**

```ts
export type GetTupleKind<Refs extends ReadonlyArray<Ref>, Kind extends RefKind = "r"> = Refs extends readonly [
  infer Head extends Ref,
  ...infer Tail extends ReadonlyArray<Ref>
]
  ? GetTupleKind<Tail, MergeKind<Kind, MatchKind<Head>>>
  : Kind
```

Added in v1.20.0

## MatchKind (type alias)

**Signature**

```ts
export type MatchKind<T extends Ref> = [T] extends [Filtered.Any] ? "f" : [T] extends [RefSubject.Any] ? "r" : "c"
```

Added in v1.20.0

## RefSubject (interface)

A RefSubject is a Subject that can be used to read and write a value.

**Signature**

```ts
export interface RefSubject<out R, in out E, in out A> extends Computed<R, E, A>, Subject.Subject<R, E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  /**
   * @since 1.20.0
   */
  readonly runUpdates: <R2, E2, B>(
    f: (ref: GetSetDelete<R, E, A>) => Effect.Effect<R2, E2, B>
  ) => Effect.Effect<R | R2, E2, B>
}
```

Added in v1.20.0

## RefSubject (namespace)

Added in v1.20.0

### Derived (interface)

A Contextual wrapper around a RefSubject

**Signature**

```ts
export interface Derived<R, E, A> extends RefSubject<R, E, A> {
  readonly persist: Effect.Effect<R, never, void>
}
```

Added in v1.18.0

### Tagged (interface)

**Signature**

```ts
export interface Tagged<I, E, A> extends RefSubject<I, E, A> {
  /**
   * @since 1.20.0
   */
  readonly tag: C.Tagged<I, RefSubject<never, E, A>>
  /**
   * @since 1.20.0
   */
  readonly make: <R>(fxOrEffect: Fx<R, E, A> | Effect.Effect<R, E, A>) => Layer.Layer<R, never, I>
}
```

Added in v1.20.0

### Any (type alias)

**Signature**

```ts
export type Any =
  | RefSubject<any, any, any>
  | RefSubject<never, any, any>
  | RefSubject<any, never, any>
  | RefSubject<never, never, any>
```

Added in v1.20.0

## RefSubjectOptions (interface)

**Signature**

```ts
export interface RefSubjectOptions<A> {
  readonly eq?: Equivalence.Equivalence<A>
  readonly replay?: number
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy
}
```

Added in v1.20.0

## Success (type alias)

**Signature**

```ts
export type Success<T> = Fx.Success<T>
```

Added in v1.20.0

## TupleFrom (type alias)

**Signature**

```ts
export type TupleFrom<
  Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
> = {
  c: [ComputedTupleFrom<Refs>] extends [Computed<infer R, infer E, infer A>] ? Computed<R, E, A> : never
  f: [FilteredTupleFrom<Refs>] extends [Filtered<infer R, infer E, infer A>] ? Filtered<R, E, A> : never
  r: [RefSubjectTupleFrom<Refs>] extends [RefSubject<infer R, infer E, infer A>] ? RefSubject<R, E, A> : never
}[GetTupleKind<Refs>]
```

Added in v1.20.0

## asFalse

Set the value to false

**Signature**

```ts
export declare const asFalse: <R, E>(ref: RefSubject<R, E, boolean>) => Effect.Effect<R, E, boolean>
```

Added in v1.18.0

## asTrue

Set the value to true

**Signature**

```ts
export declare const asTrue: <R, E>(ref: RefSubject<R, E, boolean>) => Effect.Effect<R, E, boolean>
```

Added in v1.18.0

## compact

**Signature**

```ts
export declare const compact: {
  <R, E, A>(ref: RefSubject<R, E, Option.Option<A>> | Computed<R, E, Option.Option<A>>): Filtered<R, E, A>
  <R, E, A>(ref: Filtered<R, E, Option.Option<A>>): Filtered<R, E, A>
  <R0, E0, R, E, A, R2, E2>(
    versioned: Versioned.Versioned<R0, E0, R, E, Option.Option<A>, R2, E2, Option.Option<A>>
  ): Filtered<
    R0 | R2 | Exclude<R, Scope.Scope>,
    E0 | E | Exclude<E, Cause.NoSuchElementException> | Exclude<E2, Cause.NoSuchElementException>,
    A
  >
}
```

Added in v1.20.0

## computedFromTag

**Signature**

```ts
export declare function computedFromTag<I, S, R, E, A>(
  tag: C.Tag<I, S>,
  f: (s: S) => Computed<R, E, A>
): Computed<I | R, E, A>
```

Added in v1.20.0

## decrement

Set the value to false

**Signature**

```ts
export declare const decrement: <R, E>(ref: RefSubject<R, E, number>) => Effect.Effect<R, E, number>
```

Added in v1.18.0

## delete

**Signature**

```ts
export declare const delete: typeof reset
```

Added in v1.20.0

## drop

**Signature**

```ts
export declare const drop: {
  (drop: number): <R, E, A>(ref: RefSubject<R, E, A>) => RefSubject<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, drop: number): RefSubject<R, E, A>
}
```

Added in v1.20.0

## filter

**Signature**

```ts
export declare const filter: {
  <A>(f: (a: A) => boolean): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>): Filtered<R, E, A>
    <R0, E0, R, E, R2, E2>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => boolean
    ): Filtered<R0 | R2, E0 | E | E2, A>
  }
  <R, E, A>(ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>, f: (a: A) => boolean): Filtered<R, E, A>
  <R0, E0, R, E, A, R2, E2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => boolean
  ): Filtered<R0 | R2 | R3 | Exclude<R, Scope.Scope>, E0 | E | E2 | E3, A>
}
```

Added in v1.20.0

## filterEffect

**Signature**

```ts
export declare const filterEffect: {
  <R, E, A, R2, E2>(
    ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Filtered<R | R2, E | E2, A>
  <R0, E0, R, E, A, R2, E2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, boolean>
  ): Filtered<R0 | R2 | R3 | Exclude<R, Scope.Scope>, E0 | E | E2 | E3, A>
}
```

Added in v1.20.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <A, B>(
    f: (a: A) => Option.Option<B>
  ): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>): Filtered<R, E, B>
    <R0, E0, R, E, R2, E2, B>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => Option.Option<B>
    ): Filtered<R0 | R2, E0 | E | E2, B>
  }
  <R0, E0, R, E, A, R2, E2, B>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Option.Option<B>
  ): Filtered<R0 | R2 | Exclude<R, Scope.Scope>, E0 | E | E2, B>
  <R, E, A, B>(
    ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
    f: (a: A) => Option.Option<B>
  ): Filtered<R, E, B>
}
```

Added in v1.20.0

## filterMapEffect

**Signature**

```ts
export declare const filterMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A>): Filtered<R2 | R, E2 | E, B>
    <R, E>(ref: Filtered<R, E, A>): Filtered<R2 | R, E2 | E, B>
    <R0, E0, R, E, R2, E2, B>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
    ): Filtered<R0 | R2, E0 | E | E2, B>
  }
  <R, E, A, R2, E2, B>(
    ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ): Filtered<R | R2, E | E2, B>
  <R0, E0, R, E, A, R2, E2, B, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, Option.Option<B>>
  ): Filtered<R0 | R2 | R3 | Exclude<R, Scope.Scope>, E0 | E | E2 | E3, B>
}
```

Added in v1.20.0

## filteredFromTag

**Signature**

```ts
export declare function filteredFromTag<I, S, R, E, A>(
  tag: C.Tag<I, S>,
  f: (s: S) => Filtered<R, E, A>
): Filtered<I | R, E, A>
```

Added in v1.20.0

## fromEffect

**Signature**

```ts
export declare function fromEffect<R, E, A>(
  effect: Effect.Effect<R, E, A>,
  options?: RefSubjectOptions<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>
```

Added in v1.20.0

## fromFx

**Signature**

```ts
export declare function fromFx<R, E, A>(
  fx: Fx<R, E, A>,
  options?: RefSubjectOptions<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>
```

Added in v1.20.0

## fromRefSubject

**Signature**

```ts
export declare function fromRefSubject<R, E, A>(
  ref: RefSubject<R, E, A>,
  options?: RefSubjectOptions<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject.Derived<never, E, A>>
```

Added in v1.20.0

## fromTag

**Signature**

```ts
export declare function fromTag<I, S, R, E, A>(
  tag: C.Tag<I, S>,
  f: (s: S) => RefSubject<R, E, A>
): RefSubject<I | R, E, A>
```

Added in v1.20.0

## increment

Set the value to true

**Signature**

```ts
export declare const increment: <R, E>(ref: RefSubject<R, E, number>) => Effect.Effect<R, E, number>
```

Added in v1.18.0

## isComputed

**Signature**

```ts
export declare function isComputed<R, E, A>(u: unknown): u is Computed<R, E, A>
export declare function isComputed(u: unknown): u is Computed.Any
```

Added in v1.20.0

## isDerived

**Signature**

```ts
export declare function isDerived<R, E, A>(u: unknown): u is RefSubject.Derived<R, E, A>
export declare function isDerived(u: unknown): u is RefSubject.Derived<unknown, unknown, unknown>
```

Added in v1.20.0

## isFiltered

**Signature**

```ts
export declare function isFiltered<R, E, A>(u: unknown): u is Filtered<R, E, A>
export declare function isFiltered(u: unknown): u is Filtered.Any
```

Added in v1.20.0

## isRefSubject

**Signature**

```ts
export declare function isRefSubject<R, E, A>(u: unknown): u is RefSubject<R, E, A>
export declare function isRefSubject(u: unknown): u is RefSubject.Any
```

Added in v1.20.0

## make

**Signature**

```ts
export declare const make: {
  <R, E, A>(
    ref: RefSubject<R, E, A>,
    options?: RefSubjectOptions<A> | undefined
  ): Effect.Effect<Scope.Scope | R, never, RefSubject.Derived<never, E, A>>
  <R, E, A>(
    fxOrEffect: Fx<R, E, A> | Effect.Effect<R, E, A>,
    options?: RefSubjectOptions<A> | undefined
  ): Effect.Effect<Scope.Scope | R, never, RefSubject<never, E, A>>
  <R, E, A>(
    fxOrEffect: Fx<R, E, A> | Effect.Effect<R, E, A> | RefSubject<R, E, A>,
    options?: RefSubjectOptions<A> | undefined
  ): Effect.Effect<Scope.Scope | R, never, RefSubject<never, E, A> | RefSubject.Derived<never, E, A>>
}
```

Added in v1.20.0

## map

**Signature**

```ts
export declare const map: {
  <A, B>(
    f: (a: A) => B
  ): {
    <R, E>(ref: RefSubject<R, E, A>): Computed<R, E, B>
    <R, E>(ref: Computed<R, E, A>): Computed<R, E, B>
    <R, E>(ref: Filtered<R, E, A>): Filtered<R, E, B>
    <R0, E0, R, E, R2, E2>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => B
    ): Computed<R0 | R2, E0 | E | E2, B>
  }
  <R, E, A, B>(ref: RefSubject<R, E, A> | Computed<R, E, A>, f: (a: A) => B): Computed<R, E, B>
  <R, E, A, B>(filtered: Filtered<R, E, A>, f: (a: A) => B): Filtered<R, E, B>
  <R0, E0, R, E, A, R2, E2, B>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => B
  ):
    | Computed<R0 | R2 | Exclude<R, Scope.Scope>, E0 | E | E2, B>
    | Filtered<R0 | R2 | Exclude<R, Scope.Scope>, E0 | E | E2, B>
}
```

Added in v1.20.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A>): Computed<R2 | R, E2 | E, B>
    <R, E>(ref: Filtered<R, E, A>): Filtered<R2 | R, E2 | E, B>
    <R0, E0, R, E, R2, E2, C>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => Effect.Effect<R2, E2, C>
    ): Computed<R0 | R2, E0 | E | E2, C>
  }
  <R, E, A, R2, E2, B>(
    ref: RefSubject<R, E, A> | Computed<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Computed<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(ref: Filtered<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Filtered<R | R2, E | E2, B>
  <R0, E0, R, E, A, R2, E2, R3, E3, C>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, C>
  ): Computed<R0 | R2 | R3 | Exclude<R, Scope.Scope>, E0 | E | E2 | E3, C>
}
```

Added in v1.20.0

## modify

**Signature**

```ts
export declare const modify: {
  <A, B>(f: (value: A) => readonly [B, A]): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R, E, B>
  <R, E, A, B>(ref: RefSubject<R, E, A>, f: (value: A) => readonly [B, A]): Effect.Effect<R, E, B>
}
```

Added in v1.20.0

## modifyEffect

**Signature**

```ts
export declare const modifyEffect: {
  <A, R2, E2, B>(
    f: (value: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    ref: RefSubject<R, E, A>,
    f: (value: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ): Effect.Effect<R | R2, E | E2, B>
}
```

Added in v1.20.0

## of

**Signature**

```ts
export declare function of<A, E = never>(
  a: A,
  options?: RefSubjectOptions<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, E, A>>
```

Added in v1.20.0

## provide

**Signature**

```ts
export declare const provide: {
  <S>(context: C.Context<S> | Runtime.Runtime<S>): {
    <R, E, A>(filtered: Filtered<R, E, A>): Filtered<Exclude<R, S>, E, A>
    <R, E, A>(computed: Computed<R, E, A>): Computed<Exclude<R, S>, E, A>
    <R, E, A>(ref: RefSubject<R, E, A>): RefSubject<Exclude<R, S>, E, A>
  }
  <R2, S>(
    layer: Layer.Layer<R2, never, S>
  ): {
    <R, E, A>(filtered: Filtered<R, E, A>): Filtered<R2 | Exclude<R, S>, E, A>
    <R, E, A>(computed: Computed<R, E, A>): Computed<R2 | Exclude<R, S>, E, A>
    <R, E, A>(ref: RefSubject<R, E, A>): RefSubject<R2 | Exclude<R, S>, E, A>
  }
  <R, E, A, S>(filtered: Filtered<R, E, A>, context: C.Context<S> | Runtime.Runtime<S>): Filtered<Exclude<R, S>, E, A>
  <R, E, A, S>(computed: Computed<R, E, A>, context: C.Context<S> | Runtime.Runtime<S>): Computed<Exclude<R, S>, E, A>
  <R, E, A, S>(ref: RefSubject<R, E, A>, context: C.Context<S> | Runtime.Runtime<S>): RefSubject<Exclude<R, S>, E, A>
  <R, E, A, R2, S>(filtered: Filtered<R, E, A>, layer: Layer.Layer<R2, never, S>): Filtered<R2 | Exclude<R, S>, E, A>
  <R, E, A, R2, S>(computed: Computed<R, E, A>, layer: Layer.Layer<R2, never, S>): Computed<R2 | Exclude<R, S>, E, A>
  <R, E, A, R2, S>(ref: RefSubject<R, E, A>, layer: Layer.Layer<R2, never, S>): RefSubject<R2 | Exclude<R, S>, E, A>
}
```

Added in v1.20.0

## reset

**Signature**

```ts
export declare function reset<R, E, A>(ref: RefSubject<R, E, A>): Effect.Effect<R, E, Option.Option<A>>
```

Added in v1.20.0

## runUpdates

**Signature**

```ts
export declare const runUpdates: {
  <R, E, A, R2, E2, B, R3 = never, E3 = never, C = never>(
    f: (ref: GetSetDelete<R, E, A>) => Effect.Effect<R2, E2, B>,
    options?:
      | { readonly onInterrupt: (value: A) => Effect.Effect<R3, E3, C>; readonly value?: "initial" | "current" }
      | undefined
  ): (ref: RefSubject<R, E, A>) => Effect.Effect<R | R2 | R3, E | E2 | E3, B>
  <R, E, A, R2, E2, B, R3 = never, E3 = never, C = never>(
    ref: RefSubject<R, E, A>,
    f: (ref: GetSetDelete<R, E, A>) => Effect.Effect<R2, E2, B>,
    options?:
      | { readonly onInterrupt: (value: A) => Effect.Effect<R3, E3, C>; readonly value?: "initial" | "current" }
      | undefined
  ): Effect.Effect<R | R2 | R3, E | E2 | E3, B>
}
```

Added in v1.20.0

## set

**Signature**

```ts
export declare const set: {
  <A>(value: A): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, a: A): Effect.Effect<R, E, A>
}
```

Added in v1.20.0

## skipRepeats

**Signature**

```ts
export declare function skipRepeats<R, E, A>(ref: RefSubject<R, E, A> | Computed<R, E, A>): Computed<R, E, A>
export declare function skipRepeats<R, E, A>(ref: Filtered<R, E, A>): Filtered<R, E, A>
export declare function skipRepeats<R, E, A>(
  ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>
): Computed<R, E, A> | Filtered<R, E, A>
```

Added in v1.20.0

## skipRepeatsWith

**Signature**

```ts
export declare const skipRepeatsWith: {
  <A>(eq: Equivalence.Equivalence<A>): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A>): Computed<R, E, A>
    <R, E>(ref: Filtered<R, E, A>): Filtered<R, E, A>
  }
  <R, E, A>(ref: RefSubject<R, E, A> | Computed<R, E, A>, eq: Equivalence.Equivalence<A>): Computed<R, E, A>
  <R, E, A>(ref: Filtered<R, E, A>, eq: Equivalence.Equivalence<A>): Filtered<R, E, A>
  <R, E, A>(
    ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
    eq: Equivalence.Equivalence<A>
  ): Computed<R, E, A> | Filtered<R, E, A>
}
```

Added in v1.20.0

## slice

**Signature**

```ts
export declare const slice: {
  (drop: number, take: number): <R, E, A>(ref: RefSubject<R, E, A>) => RefSubject<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, drop: number, take: number): RefSubject<R, E, A>
}
```

Added in v1.20.0

## struct

**Signature**

```ts
export declare function struct<
  const Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>
>(refs: Refs): StructFrom<Refs>
```

Added in v1.20.0

## tagged

**Signature**

```ts
export declare function tagged<E, A>(
  replay?: number
): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
}
```

Added in v1.20.0

## take

**Signature**

```ts
export declare const take: {
  (take: number): <R, E, A>(ref: RefSubject<R, E, A>) => RefSubject<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, take: number): RefSubject<R, E, A>
}
```

Added in v1.20.0

## toggle

Toggle the boolean value between true and false

**Signature**

```ts
export declare const toggle: <R, E>(ref: RefSubject<R, E, boolean>) => Effect.Effect<R, E, boolean>
```

Added in v1.18.0

## transform

**Signature**

```ts
export declare function transform<R, E, A, B>(
  ref: RefSubject<R, E, A>,
  from: (a: A) => B,
  to: (b: B) => A
): RefSubject<R, E, B>
```

Added in v1.20.0

## transformOrFail

**Signature**

```ts
export declare function transformOrFail<R, E, R2, E2, A, R3, E3, B>(
  ref: RefSubject<R, E, A>,
  from: (a: A) => Effect.Effect<R2, E2, B>,
  to: (b: B) => Effect.Effect<R3, E3, A>
): RefSubject<R | R2 | R3, E | E2 | E3, B>
```

Added in v1.20.0

## tuple

**Signature**

```ts
export declare function tuple<
  const Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
>(refs: Refs): TupleFrom<Refs>
```

Added in v1.20.0

## unsafeMake

**Signature**

```ts
export declare function unsafeMake<E, A>(params: {
  readonly id: FiberId.FiberId
  readonly initial: Effect.Effect<never, E, A>
  readonly options?: RefSubjectOptions<A> | undefined
  readonly scope: Scope.CloseableScope
  readonly initialValue?: A
}): Effect.Effect<never, never, RefSubject<never, E, A>>
```

Added in v1.20.0

## update

**Signature**

```ts
export declare const update: {
  <A>(f: (value: A) => A): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, f: (value: A) => A): Effect.Effect<R, E, A>
}
```

Added in v1.20.0

## updateEffect

**Signature**

```ts
export declare const updateEffect: {
  <A, R2, E2>(
    f: (value: A) => Effect.Effect<R2, E2, A>
  ): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(
    ref: RefSubject<R, E, A>,
    f: (value: A) => Effect.Effect<R2, E2, A>
  ): Effect.Effect<R | R2, E | E2, A>
}
```

Added in v1.20.0
