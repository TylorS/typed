---
title: RefSubject.ts
nav_order: 21
parent: "@typed/fx"
---

## RefSubject overview

A RefSubject is the core abstraction for keeping state and subscribing to its
changes over time.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [compact](#compact)
  - [split](#split)
- [constructors](#constructors)
  - [fromEffect](#fromeffect)
  - [make](#make)
  - [makeWithExtension](#makewithextension)
  - [of](#of)
  - [sync](#sync)
  - [tagged](#tagged)
  - [unsafeMake](#unsafemake)
- [models](#models)
  - [RefSubject (interface)](#refsubject-interface)
- [utils](#utils)
  - [Context (type alias)](#context-type-alias)
  - [Error (type alias)](#error-type-alias)
  - [MakeRefSubject (type alias)](#makerefsubject-type-alias)
  - [RefSubject (namespace)](#refsubject-namespace)
    - [Derived (interface)](#derived-interface)
    - [Tagged (interface)](#tagged-interface)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias-1)
    - [Error (type alias)](#error-type-alias-1)
    - [Success (type alias)](#success-type-alias)
  - [Success (type alias)](#success-type-alias-1)
  - [ToDerived (type alias)](#toderived-type-alias)
  - [ToRefSubject (type alias)](#torefsubject-type-alias)
  - [deriveFromSchema](#derivefromschema)
  - [deriveToSchema](#derivetoschema)
  - [fromSubscriptionRef](#fromsubscriptionref)
  - [struct](#struct)
  - [transform](#transform)
  - [tuple](#tuple)

---

# combinators

## compact

Flatten an RefSubject of an Option into a Filtered.

**Signature**

```ts
export declare const compact: <R, E, A>(refSubject: RefSubject<R, E, Option.Option<A>>) => Filtered<R, E, A>
```

Added in v1.18.0

## split

Split a RefSubject's into 2 Filtered values that track its errors and
success values separately.

**Signature**

```ts
export declare const split: <R, E, A>(
  refSubject: RefSubject<R, E, A>
) => readonly [Filtered<R, never, E>, Filtered<R, never, A>]
```

Added in v1.18.0

# constructors

## fromEffect

Construct a RefSubject with a lazily initialized value.

**Signature**

```ts
export declare function fromEffect<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>
```

Added in v1.18.0

## make

Construct a RefSubject from any Fx value.

**Signature**

```ts
export declare function make<R, E, A>(
  fx: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>
export declare function make<R, E, A>(
  fx: Fx.FxInput<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>
```

Added in v1.18.0

## makeWithExtension

Construct a RefSubject from any Fx value.

**Signature**

```ts
export declare function makeWithExtension<R, E, A, B>(
  fx: Effect.Effect<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<never, E, A> & B>
export declare function makeWithExtension<R, E, A, B>(
  fx: Fx.FxInput<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A> & B>
```

Added in v1.18.0

## of

Construct a RefSubject from a synchronous value.

**Signature**

```ts
export declare function of<A, E = never>(
  initial: A,
  eq?: Equivalence<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, E, A>>
```

Added in v1.18.0

## sync

Construct a RefSubject from a synchronous value.

**Signature**

```ts
export declare function sync<A, E = never>(
  initial: () => A,
  eq?: Equivalence<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, E, A>>
```

Added in v1.18.0

## tagged

Create a contextual wrapper around a RefSubject while maintaing the full API of
a Ref Subject.

**Signature**

```ts
export declare function tagged<A>(defaultEq?: Equivalence<A>): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.Tagged<C.IdentifierOf<I>, never, A>
  <const I>(identifier: I | string): RefSubject.Tagged<C.IdentifierOf<I>, never, A>
}
export declare function tagged<E, A>(
  defaultEq?: Equivalence<A>
): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I | string): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
}
```

Added in v1.18.0

## unsafeMake

Construct a RefSubject with an initial value and the specified subject.

**Signature**

```ts
export declare const unsafeMake: <R, E, A>(
  initial: Effect.Effect<R, E, A>,
  subject: Subject.Subject<R, E, A>,
  eq?: Equivalence<A> | undefined
) => RefSubject<R, E, A>
```

Added in v1.18.0

# models

## RefSubject (interface)

A RefSubject is a Subject that has a current value that can be read and updated.

**Signature**

```ts
export interface RefSubject<R, in out E, in out A> extends Computed<R, E, A>, Subject.Subject<R, E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  /**
   * Get the current value of this RefSubject. If the RefSubject has not been initialized
   * then the initial value will be computed and returned. Concurrent calls to `get` will
   * only compute the initial value once.
   * @since 1.18.0
   */
  readonly get: Effect.Effect<R, E, A>

  /**
   * Set the current value of this RefSubject.
   * @since 1.18.0
   */
  readonly set: (a: A) => Effect.Effect<R, never, A>

  /**
   * Modify the current value of this RefSubject using the provided function.
   * @since 1.18.0
   */
  readonly update: (f: (a: A) => A) => Effect.Effect<R, E, A>

  /**
   * Modify the current value of this RefSubject and compute a new value.
   * @since 1.18.0
   */
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<R, E, B>

  /**
   * Delete the current value of this RefSubject. If it was not initialized the Option.none will be returned.
   * Otherwise the current value will be returned as an Option.some and the RefSubject will be uninitialized.
   * If there are existing subscribers to this RefSubject then the RefSubject will be re-initialized.
   * @since 1.18.0
   */
  readonly delete: Effect.Effect<R, never, Option.Option<A>>

  /**
   * Modify the current value of this RefSubject and compute a new value using the provided effectful function.
   * @since 1.18.0
   */
  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<R | R2, E | E2, B>

  /**
   * Modify the current value of this RefSubject using the provided effectful function.
   * @since 1.18.0
   */
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R | R2, E | E2, A>

  /**
   * Modify the current value of this RefSubject and compute a new value using the provided effectful function.
   * The key difference is it will allow running a workflow and setting the value multiple times. Optionally,
   * another function can be provided to change the value
   * @since 1.18.0
   */
  readonly runUpdate: <R2, E2, B, R3 = never, E3 = never>(
    updates: (get: RefSubject<R, E, A>["get"], set: RefSubject<R, E, A>["set"]) => Effect.Effect<R2, E2, B>,
    onInterrupt?: (a: A) => Effect.Effect<R3, E3, A>
  ) => Effect.Effect<R | R2 | R3, E | E2 | E3, B>

  /**
   * Interrupt the current Fibers.
   */
  readonly interrupt: Effect.Effect<R, never, void>
}
```

Added in v1.18.0

# utils

## Context (type alias)

Extract the Identifier from a RefSubject

**Signature**

```ts
export type Context<T> = RefSubject.Context<T>
```

Added in v1.18.0

## Error (type alias)

Extract the Error from a RefSubject

**Signature**

```ts
export type Error<T> = RefSubject.Error<T>
```

Added in v1.18.0

## MakeRefSubject (type alias)

MakeRefSubject is a RefSubject factory function dervied from a Schema.

**Signature**

```ts
export type MakeRefSubject<O> = {
  <R, E>(input: RefSubject<R, E, O>, eq?: Equivalence<O>): Effect.Effect<R | Scope.Scope, never, ToDerived<R, E, O>>

  <R, E>(input: Effect.Effect<R, E, O>, eq?: Equivalence<O>): Effect.Effect<R | Scope.Scope, never, ToRefSubject<E, O>>

  <R, E>(input: Stream.Stream<R, E, O>, eq?: Equivalence<O>): Effect.Effect<R | Scope.Scope, never, ToRefSubject<E, O>>

  <R, E>(input: Fx.Fx<R, E, O>, eq?: Equivalence<O>): Effect.Effect<R | Scope.Scope, never, ToRefSubject<E, O>>

  <E>(input: Cause.Cause<E>, eq?: Equivalence<O>): Effect.Effect<Scope.Scope, never, ToRefSubject<E, O>>

  <R, E>(input: Fx.FxInput<R, E, O>, eq?: Equivalence<O>): Effect.Effect<R | Scope.Scope, never, ToRefSubject<E, O>>
}
```

Added in v1.18.0

## RefSubject (namespace)

Added in v1.18.0

### Derived (interface)

A Contextual wrapper around a RefSubject

**Signature**

```ts
export interface Derived<R0, R, E, A> extends RefSubject<R, E, A> {
  readonly persist: Effect.Effect<R0, never, void>
}
```

Added in v1.18.0

### Tagged (interface)

A Contextual wrapper around a RefSubject

**Signature**

```ts
export interface Tagged<I, E, A> extends RefSubject<I, E, A> {
  readonly tag: C.Tagged<I, RefSubject<never, E, A>>

  /**
   * Make a layer initializing a RefSubject
   * @since 1.18.0
   */
  readonly make: <R = never>(
    fx: Exclude<Fx.FxInput<R, E, A>, Iterable<A>>,
    eq?: Equivalence<A>
  ) => Layer.Layer<R, never, I>

  /**
   * Make a layer initializing a RefSubject
   * @since 1.18.0
   */
  readonly of: (value: A, eq?: Equivalence<A>) => Layer.Layer<never, never, I>

  /**
   * Provide an implementation of this RefSubject
   * @since 1.18.0
   */
  readonly provide: <R2>(
    fx: Fx.FxInput<R2, E, A>,
    eq?: Equivalence<A>
  ) => <R3, E3, C>(effect: Effect.Effect<R3, E3, C>) => Effect.Effect<R2 | Exclude<R3, I> | Scope.Scope, E | E3, C>

  /**
   * Provide an implementation of this RefSubject
   * @since 1.18.0
   */
  readonly provideFx: <R2>(
    fx: Fx.FxInput<R2, E, A>,
    eq?: Equivalence<A>
  ) => <R3, E3, C>(effect: Fx.Fx<R3, E3, C>) => Fx.Fx<R2 | Exclude<R3, I> | Scope.Scope, E | E3, C>
}
```

Added in v1.18.0

### Any (type alias)

**Signature**

```ts
export type Any =
  | RefSubject<any, any, any>
  | RefSubject<never, any, any>
  | RefSubject<any, never, any>
  | RefSubject<never, never, any>
```

Added in v1.18.0

### Context (type alias)

Extract the Identifier from a RefSubject

**Signature**

```ts
export type Context<T> = T extends RefSubject<infer I, infer _, infer __> ? I : never
```

Added in v1.18.0

### Error (type alias)

Extract the Error from a RefSubject

**Signature**

```ts
export type Error<T> = T extends RefSubject<infer _, infer E, infer __> ? E : never
```

Added in v1.18.0

### Success (type alias)

Extract the State from a RefSubject

**Signature**

```ts
export type Success<T> = T extends RefSubject<infer _, infer __, infer S> ? S : never
```

Added in v1.18.0

## Success (type alias)

Extract the State from a RefSubject

**Signature**

```ts
export type Success<T> = RefSubject.Success<T>
```

Added in v1.18.0

## ToDerived (type alias)

Converts an error `E` and an output `O` into a RefSubject or a Record of RefSubjects if
the ouput value is a Record as well.

**Signature**

```ts
export type ToDerived<R, E, O> = ToRefSubject<E, O> & {
  readonly persist: Effect.Effect<R, E, O>
}
```

Added in v1.18.0

## ToRefSubject (type alias)

Converts an error `E` and an output `O` into a RefSubject or a Record of RefSubjects if
the ouput value is a Record as well.

**Signature**

```ts
export type ToRefSubject<E, O> = O extends Readonly<Record<PropertyKey, any>>
  ? {
      readonly [K in keyof O]: ToRefSubject<E, O[K]>
    }
  : RefSubject<never, E, O>
```

Added in v1.18.0

## deriveFromSchema

Derive a RefSubjectSchema using the "from" or "encoded" value represented by a Schema.

**Signature**

```ts
export declare function deriveFromSchema<I, O>(schema: Schema.Schema<I, O>): MakeRefSubject<I>
```

Added in v1.18.0

## deriveToSchema

Derive a RefSubjectSchema using the "to" or "decoded" value represented by a Schema.

**Signature**

```ts
export declare function deriveToSchema<I, O>(schema: Schema.Schema<I, O>): MakeRefSubject<O>
```

Added in v1.18.0

## fromSubscriptionRef

**Signature**

```ts
export declare function fromSubscriptionRef<A>(
  subscriptionRef: SubscriptionRef.SubscriptionRef<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, never, A>>
```

Added in v1.18.0

## struct

**Signature**

```ts
export declare const struct: <const REFS extends Readonly<Record<PropertyKey, RefSubject.Any>>>(
  refs: REFS
) => RefSubject<
  RefSubject.Context<REFS[string]>,
  RefSubject.Error<REFS[string]>,
  { readonly [K in keyof REFS]: RefSubject.Success<REFS[K]> }
>
```

Added in v1.18.0

## transform

**Signature**

```ts
export declare const transform: {
  <A, B>(from: (a: A) => B, to: (b: B) => A): <R, E>(ref: RefSubject<R, E, A>) => RefSubject<R, E, B>
  <R, E, A, B>(ref: RefSubject<R, E, A>, from: (a: A) => B, to: (b: B) => A): RefSubject<R, E, B>
}
```

Added in v1.18.0

## tuple

**Signature**

```ts
export declare const tuple: <const REFS extends readonly RefSubject.Any[]>(
  ...refs: REFS
) => RefSubject<
  RefSubject.Context<REFS[number]>,
  RefSubject.Error<REFS[number]>,
  { readonly [K in keyof REFS]: RefSubject.Success<REFS[K]> }
>
```

Added in v1.18.0
