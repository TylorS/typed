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
  - [Identifier (type alias)](#identifier-type-alias)
  - [MatchKind (type alias)](#matchkind-type-alias)
  - [RefSubject (interface)](#refsubject-interface)
  - [RefSubject (namespace)](#refsubject-namespace)
    - [Derived (interface)](#derived-interface)
    - [Tagged (interface)](#tagged-interface)
    - [Any (type alias)](#any-type-alias-2)
    - [Context (type alias)](#context-type-alias-1)
    - [Error (type alias)](#error-type-alias-1)
    - [Identifier (type alias)](#identifier-type-alias-1)
    - [Success (type alias)](#success-type-alias)
  - [RefSubjectOptions (interface)](#refsubjectoptions-interface)
  - [Success (type alias)](#success-type-alias-1)
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
export interface Computed<out A, out E = never, out R = never>
  extends Versioned.Versioned<R, E, A, E, R | Scope.Scope, A, E, R> {
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
export type Context<T> = RefSubject.Context<T>
```

Added in v1.20.0

## Error (type alias)

**Signature**

```ts
export type Error<T> = RefSubject.Error<T>
```

Added in v1.20.0

## Filtered (interface)

A Filtered is essentially a readonly RefSubject that may have its values filtered out.

**Signature**

```ts
export interface Filtered<out A, out E = never, out R = never>
  extends Versioned.Versioned<R, E, A, E, R | Scope.Scope, A, E | Cause.NoSuchElementException, R> {
  readonly [FilteredTypeId]: FilteredTypeId

  /**
   * @since 1.20.0
   */
  asComputed(): Computed<Option.Option<A>, E, R>
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
export interface GetSetDelete<A, E, R> {
  /**
   * @since 1.20.0
   */
  readonly get: Effect.Effect<A, E, R>
  /**
   * @since 1.20.0
   */
  readonly set: (a: A) => Effect.Effect<A, never, R>
  /**
   * @since 1.20.0
   */
  readonly delete: Effect.Effect<Option.Option<A>, E, R>
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

## Identifier (type alias)

**Signature**

```ts
export type Identifier<T> = RefSubject.Identifier<T>
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
export interface RefSubject<in out A, in out E = never, out R = never>
  extends Computed<A, E, R>,
    Subject.Subject<A, E, R> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  /**
   * @since 1.20.0
   */
  readonly runUpdates: <B, E2, R2>(
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>
  ) => Effect.Effect<B, E2, R | R2>
}
```

Added in v1.20.0

## RefSubject (namespace)

Added in v1.20.0

### Derived (interface)

A Contextual wrapper around a RefSubject

**Signature**

```ts
export interface Derived<A, E, R> extends RefSubject<A, E, R> {
  readonly persist: Effect.Effect<void, never, R>
}
```

Added in v1.18.0

### Tagged (interface)

**Signature**

```ts
export interface Tagged<I, E, A> extends RefSubject<A, E, I> {
  /**
   * @since 1.20.0
   */
  readonly tag: C.Tagged<I, RefSubject<A, E>>
  /**
   * @since 1.20.0
   */
  readonly make: <R>(
    fxOrEffect: Fx<A, E, R> | Effect.Effect<A, E, R>,
    options?: RefSubjectOptions<A>
  ) => Layer.Layer<I, never, R>
}
```

Added in v1.20.0

### Any (type alias)

**Signature**

```ts
export type Any = RefSubject<any, any, any> | RefSubject<any, any> | RefSubject<any, never, any> | RefSubject<any>
```

Added in v1.20.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends RefSubject<infer _A, infer _E, infer R> ? R : never
```

Added in v1.20.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = T extends RefSubject<infer _A, infer E, infer _R> ? E : never
```

Added in v1.20.0

### Identifier (type alias)

**Signature**

```ts
export type Identifier<T> = T extends RefSubject.Tagged<infer R, infer _E, infer _A> ? R : never
```

Added in v1.20.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = T extends RefSubject<infer A, infer _E, infer _R> ? A : never
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
export type Success<T> = RefSubject.Success<T>
```

Added in v1.20.0

## TupleFrom (type alias)

**Signature**

```ts
export type TupleFrom<
  Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
> = {
  c: [ComputedTupleFrom<Refs>] extends [Computed<infer A, infer E, infer R>] ? Computed<A, E, R> : never
  f: [FilteredTupleFrom<Refs>] extends [Filtered<infer A, infer E, infer R>] ? Filtered<A, E, R> : never
  r: [RefSubjectTupleFrom<Refs>] extends [RefSubject<infer A, infer E, infer R>] ? RefSubject<A, E, R> : never
}[GetTupleKind<Refs>]
```

Added in v1.20.0

## asFalse

Set the value to false

**Signature**

```ts
export declare const asFalse: <E, R>(ref: RefSubject<boolean, E, R>) => Effect.Effect<boolean, E, R>
```

Added in v1.18.0

## asTrue

Set the value to true

**Signature**

```ts
export declare const asTrue: <E, R>(ref: RefSubject<boolean, E, R>) => Effect.Effect<boolean, E, R>
```

Added in v1.18.0

## compact

**Signature**

```ts
export declare const compact: {
  <A, E, R>(ref: Computed<Option.Option<A>, E, R>): Filtered<A, never, never>
  <A, E, R>(ref: Filtered<Option.Option<A>, E, R>): Filtered<A, never, never>
  <R0, E0, A, E, R, E2, R2>(
    versioned: Versioned.Versioned<R0, E0, Option.Option<A>, E, R, Option.Option<A>, E2, R2>
  ): Filtered<
    A,
    E0 | E | Exclude<E, Cause.NoSuchElementException> | Exclude<E2, Cause.NoSuchElementException>,
    R0 | R2 | Exclude<R, Scope.Scope>
  >
}
```

Added in v1.20.0

## computedFromTag

**Signature**

```ts
export declare function computedFromTag<I, S, A, E, R>(
  tag: C.Tag<I, S>,
  f: (s: S) => Computed<A, E, R>
): Computed<A, E, I | R>
```

Added in v1.20.0

## decrement

Set the value to false

**Signature**

```ts
export declare const decrement: <E, R>(ref: RefSubject<number, E, R>) => Effect.Effect<number, E, R>
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
  (drop: number): <A, E, R>(ref: RefSubject<A, E, R>) => RefSubject<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, drop: number): RefSubject<A, E, R>
}
```

Added in v1.20.0

## filter

**Signature**

```ts
export declare const filter: {
  <A>(f: (a: A) => boolean): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>): Filtered<A, E, R>
    <R0, E0, R, E, E2, R2>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => boolean
    ): Filtered<A, E0 | E | E2, R0 | R2>
  }
  <A, E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>, f: (a: A) => boolean): Filtered<A, E, R>
  <R0, E0, A, E, R, E2, R2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => boolean
  ): Filtered<A, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>
}
```

Added in v1.20.0

## filterEffect

**Signature**

```ts
export declare const filterEffect: {
  <A, E, R, E2, R2>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    f: (a: A) => Effect.Effect<boolean, E2, R2>
  ): Filtered<A, E | E2, R | R2>
  <R0, E0, A, E, R, E2, R2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<boolean, E3, R3>
  ): Filtered<A, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>
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
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>): Filtered<B, E, R>
    <R0, E0, B, E, R, E2, R2>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => Option.Option<B>
    ): Filtered<B, E0 | E | E2, R0 | R2>
  }
  <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Option.Option<B>
  ): Filtered<B, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>
  <A, E, R, B>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    f: (a: A) => Option.Option<B>
  ): Filtered<B, E, R>
}
```

Added in v1.20.0

## filterMapEffect

**Signature**

```ts
export declare const filterMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>
  ): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>): Filtered<B, E2 | E, R2 | R>
    <E, R>(ref: Filtered<A, E, R>): Filtered<B, E2 | E, R2 | R>
    <R0, E0, B, E, R, E2, R2>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>
    ): Filtered<B, E0 | E | E2, R0 | R2>
  }
  <A, E, R, B, E2, R2>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>
  ): Filtered<B, E | E2, R | R2>
  <R0, E0, A, E, R, B, E2, R2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<Option.Option<B>, E3, R3>
  ): Filtered<B, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>
}
```

Added in v1.20.0

## filteredFromTag

**Signature**

```ts
export declare function filteredFromTag<I, S, A, E, R>(
  tag: C.Tag<I, S>,
  f: (s: S) => Filtered<A, E, R>
): Filtered<A, E, R | I>
```

Added in v1.20.0

## fromEffect

**Signature**

```ts
export declare function fromEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  options?: RefSubjectOptions<A>
): Effect.Effect<RefSubject<A, E>, never, R | Scope.Scope>
```

Added in v1.20.0

## fromFx

**Signature**

```ts
export declare function fromFx<A, E, R>(
  fx: Fx<A, E, R>,
  options?: RefSubjectOptions<A>
): Effect.Effect<RefSubject<A, E>, never, R | Scope.Scope>
```

Added in v1.20.0

## fromRefSubject

**Signature**

```ts
export declare function fromRefSubject<A, E, R>(
  ref: RefSubject<A, E, R>,
  options?: RefSubjectOptions<A>
): Effect.Effect<RefSubject.Derived<A, E, R>, never, R | Scope.Scope>
```

Added in v1.20.0

## fromTag

**Signature**

```ts
export declare function fromTag<I, S, A, E, R>(
  tag: C.Tag<I, S>,
  f: (s: S) => RefSubject<A, E, R>
): RefSubject<A, E, I | R>
```

Added in v1.20.0

## increment

Set the value to true

**Signature**

```ts
export declare const increment: <E, R>(ref: RefSubject<number, E, R>) => Effect.Effect<number, E, R>
```

Added in v1.18.0

## isComputed

**Signature**

```ts
export declare function isComputed<A, E, R>(u: unknown): u is Computed<A, E, R>
export declare function isComputed(u: unknown): u is Computed.Any
```

Added in v1.20.0

## isDerived

**Signature**

```ts
export declare function isDerived<A, E, R>(u: unknown): u is RefSubject.Derived<A, E, R>
export declare function isDerived(u: unknown): u is RefSubject.Derived<unknown, unknown, unknown>
```

Added in v1.20.0

## isFiltered

**Signature**

```ts
export declare function isFiltered<A, E, R>(u: unknown): u is Filtered<A, E, R>
export declare function isFiltered(u: unknown): u is Filtered.Any
```

Added in v1.20.0

## isRefSubject

**Signature**

```ts
export declare function isRefSubject<A, E, R>(u: unknown): u is RefSubject<A, E, R>
export declare function isRefSubject(u: unknown): u is RefSubject.Any
```

Added in v1.20.0

## make

**Signature**

```ts
export declare const make: {
  <A, E = never, R = never>(
    ref: RefSubject<A, E, R>,
    options?: RefSubjectOptions<A> | undefined
  ): Effect.Effect<RefSubject.Derived<A, E, R>, never, R | Scope.Scope>
  <A, E = never, R = never>(
    fxOrEffect: Fx<A, E, R> | Effect.Effect<A, E, R>,
    options?: RefSubjectOptions<A> | undefined
  ): Effect.Effect<RefSubject<A, E, never>, never, R | Scope.Scope>
  <A, E = never, R = never>(
    fxOrEffect: Fx<A, E, R> | Effect.Effect<A, E, R> | RefSubject<A, E, R>,
    options?: RefSubjectOptions<A> | undefined
  ): Effect.Effect<RefSubject<A, E, never> | RefSubject.Derived<A, E, R>, never, R | Scope.Scope>
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
    <E, R>(ref: RefSubject<A, E, R>): Computed<B, E, R>
    <E, R>(ref: Computed<A, E, R>): Computed<B, E, R>
    <E, R>(ref: Filtered<A, E, R>): Filtered<B, E, R>
    <R0, E0, R, E, E2, R2>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => B
    ): Computed<B, E0 | E | E2, R0 | R2>
  }
  <A, E, R, B>(ref: RefSubject<A, E, R> | Computed<A, E, R>, f: (a: A) => B): Computed<B, E, R>
  <A, E, R, B>(filtered: Filtered<A, E, R>, f: (a: A) => B): Filtered<B, E, R>
  <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => B
  ):
    | Computed<B, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>
    | Filtered<B, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>
}
```

Added in v1.20.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>): Computed<B, E2 | E, R2 | R>
    <E, R>(ref: Filtered<A, E, R>): Filtered<B, E2 | E, R2 | R>
    <R0, E0, R, E, E2, R2, C>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => Effect.Effect<C, E2, R2>
    ): Computed<C, E0 | E | E2, R0 | R | R2>
  }
  <A, E, R, B, E2, R2>(
    ref: RefSubject<A, E, R> | Computed<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): Computed<B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(ref: Filtered<A, E, R>, f: (a: A) => Effect.Effect<B, E2, R2>): Filtered<B, E | E2, R | R2>
  <R0, E0, A, E, R, E2, R2, C, E3, R3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<C, E3, R3>
  ): Computed<C, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>
}
```

Added in v1.20.0

## modify

**Signature**

```ts
export declare const modify: {
  <A, B>(f: (value: A) => readonly [B, A]): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<B, E, R>
  <A, E, R, B>(ref: RefSubject<A, E, R>, f: (value: A) => readonly [B, A]): Effect.Effect<B, E, R>
}
```

Added in v1.20.0

## modifyEffect

**Signature**

```ts
export declare const modifyEffect: {
  <A, B, E2, R2>(
    f: (value: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<B, E2 | E, R2 | R>
  <A, E, R, B, E2, R2>(
    ref: RefSubject<A, E, R>,
    f: (value: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): Effect.Effect<B, E | E2, R | R2>
}
```

Added in v1.20.0

## of

**Signature**

```ts
export declare function of<A, E = never>(
  a: A,
  options?: RefSubjectOptions<A>
): Effect.Effect<RefSubject<A, E>, never, Scope.Scope>
```

Added in v1.20.0

## provide

**Signature**

```ts
export declare const provide: {
  <S>(context: C.Context<S> | Runtime.Runtime<S>): {
    <A, E, R>(filtered: Filtered<A, E, R>): Filtered<A, E, Exclude<R, S>>
    <A, E, R>(computed: Computed<A, E, R>): Computed<A, E, Exclude<R, S>>
    <A, E, R>(ref: RefSubject<A, E, R>): RefSubject<A, E, Exclude<R, S>>
  }
  <R2, S>(
    layer: Layer.Layer<S, never, R2>
  ): {
    <A, E, R>(filtered: Filtered<A, E, R>): Filtered<A, E, R2 | Exclude<R, S>>
    <A, E, R>(computed: Computed<A, E, R>): Computed<A, E, R2 | Exclude<R, S>>
    <A, E, R>(ref: RefSubject<A, E, R>): RefSubject<A, E, R2 | Exclude<R, S>>
  }
  <A, E, R, S>(filtered: Filtered<A, E, R>, context: C.Context<S> | Runtime.Runtime<S>): Filtered<A, E, Exclude<R, S>>
  <A, E, R, S>(computed: Computed<A, E, R>, context: C.Context<S> | Runtime.Runtime<S>): Computed<A, E, Exclude<R, S>>
  <A, E, R, S>(ref: RefSubject<A, E, R>, context: C.Context<S> | Runtime.Runtime<S>): RefSubject<A, E, Exclude<R, S>>
  <A, E, R, R2, S>(filtered: Filtered<A, E, R>, layer: Layer.Layer<S, never, R2>): Filtered<A, E, R2 | Exclude<R, S>>
  <A, E, R, R2, S>(computed: Computed<A, E, R>, layer: Layer.Layer<S, never, R2>): Computed<A, E, R2 | Exclude<R, S>>
  <A, E, R, R2, S>(ref: RefSubject<A, E, R>, layer: Layer.Layer<S, never, R2>): RefSubject<A, E, R2 | Exclude<R, S>>
}
```

Added in v1.20.0

## reset

**Signature**

```ts
export declare function reset<A, E, R>(ref: RefSubject<A, E, R>): Effect.Effect<Option.Option<A>, E, R>
```

Added in v1.20.0

## runUpdates

**Signature**

```ts
export declare const runUpdates: {
  <A, E, R, B, E2, R2, R3 = never, E3 = never, C = never>(
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>,
    options?:
      | { readonly onInterrupt: (value: A) => Effect.Effect<C, E3, R3>; readonly value?: "initial" | "current" }
      | undefined
  ): (ref: RefSubject<A, E, R>) => Effect.Effect<B, E | E2 | E3, R | R2 | R3>
  <A, E, R, B, E2, R2, R3 = never, E3 = never, C = never>(
    ref: RefSubject<A, E, R>,
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>,
    options?:
      | { readonly onInterrupt: (value: A) => Effect.Effect<C, E3, R3>; readonly value?: "initial" | "current" }
      | undefined
  ): Effect.Effect<B, E | E2 | E3, R | R2 | R3>
}
```

Added in v1.20.0

## set

**Signature**

```ts
export declare const set: {
  <A>(value: A): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, a: A): Effect.Effect<A, E, R>
}
```

Added in v1.20.0

## skipRepeats

**Signature**

```ts
export declare function skipRepeats<A, E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>): Computed<A, E, R>
export declare function skipRepeats<A, E, R>(ref: Filtered<A, E, R>): Filtered<A, E, R>
export declare function skipRepeats<A, E, R>(
  ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>
): Computed<A, E, R> | Filtered<A, E, R>
```

Added in v1.20.0

## skipRepeatsWith

**Signature**

```ts
export declare const skipRepeatsWith: {
  <A>(eq: Equivalence.Equivalence<A>): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>): Computed<A, E, R>
    <E, R>(ref: Filtered<A, E, R>): Filtered<A, E, R>
  }
  <A, E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>, eq: Equivalence.Equivalence<A>): Computed<A, E, R>
  <A, E, R>(ref: Filtered<A, E, R>, eq: Equivalence.Equivalence<A>): Filtered<A, E, R>
  <A, E, R>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    eq: Equivalence.Equivalence<A>
  ): Computed<A, E, R> | Filtered<A, E, R>
}
```

Added in v1.20.0

## slice

**Signature**

```ts
export declare const slice: {
  (drop: number, take: number): <A, E, R>(ref: RefSubject<A, E, R>) => RefSubject<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, drop: number, take: number): RefSubject<A, E, R>
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
  (take: number): <A, E, R>(ref: RefSubject<A, E, R>) => RefSubject<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, take: number): RefSubject<A, E, R>
}
```

Added in v1.20.0

## toggle

Toggle the boolean value between true and false

**Signature**

```ts
export declare const toggle: <E, R>(ref: RefSubject<boolean, E, R>) => Effect.Effect<boolean, E, R>
```

Added in v1.18.0

## transform

**Signature**

```ts
export declare function transform<A, E, R, B>(
  ref: RefSubject<A, E, R>,
  from: (a: A) => B,
  to: (b: B) => A
): RefSubject<B, E, R>
```

Added in v1.20.0

## transformOrFail

**Signature**

```ts
export declare function transformOrFail<R, E, A, E2, R2, R3, E3, B>(
  ref: RefSubject<A, E, R>,
  from: (a: A) => Effect.Effect<B, E2, R2>,
  to: (b: B) => Effect.Effect<A, E3, R3>
): RefSubject<B, E | E2 | E3, R | R2 | R3>
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
  readonly initial: Effect.Effect<A, E>
  readonly options?: RefSubjectOptions<A> | undefined
  readonly scope: Scope.CloseableScope
  readonly initialValue?: A
}): Effect.Effect<RefSubject<A, E>>
```

Added in v1.20.0

## update

**Signature**

```ts
export declare const update: {
  <A>(f: (value: A) => A): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, f: (value: A) => A): Effect.Effect<A, E, R>
}
```

Added in v1.20.0

## updateEffect

**Signature**

```ts
export declare const updateEffect: {
  <A, E2, R2>(
    f: (value: A) => Effect.Effect<A, E2, R2>
  ): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<A, E2 | E, R2 | R>
  <A, E, R, E2, R2>(
    ref: RefSubject<A, E, R>,
    f: (value: A) => Effect.Effect<A, E2, R2>
  ): Effect.Effect<A, E | E2, R | R2>
}
```

Added in v1.20.0
