---
title: RefAsyncDataArray.ts
nav_order: 15
parent: "@typed/fx"
---

## RefAsyncDataArray overview

A RefAsyncDataArray is a RefSubject that holds a AsyncData value of an array.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [RefAsyncDataArray (interface)](#refasyncdataarray-interface)
  - [RefAsyncDataArray (namespace)](#refasyncdataarray-namespace)
    - [Tagged (interface)](#tagged-interface)
  - [make](#make)
  - [matchKeyed](#matchkeyed)
  - [tagged](#tagged)

---

# utils

## RefAsyncDataArray (interface)

A RefAsyncDataArray is a RefSubject that holds a AsyncData value of an array.

**Signature**

```ts
export interface RefAsyncDataArray<R, E, A> extends RefAsyncData.RefAsyncData<R, E, ReadonlyArray<A>> {}
```

Added in v1.18.0

## RefAsyncDataArray (namespace)

Added in v1.18.0

### Tagged (interface)

**Signature**

```ts
export interface Tagged<I, E, A> extends RefAsyncData.RefAsyncData.Tagged<I, E, ReadonlyArray<A>> {}
```

Added in v1.18.0

## make

**Signature**

```ts
export declare const make: <E, A>() => Effect.Effect<Scope.Scope, never, RefAsyncDataArray<never, E, A>>
```

Added in v1.18.0

## matchKeyed

**Signature**

```ts
export declare const matchKeyed: {
  <
    E1,
    A,
    B,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>
  >(
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (data: RefAsyncData.LoadingComputed) => Loading
      Failure: (data: Computed.Computed<never, never, E1>, computed: RefAsyncData.FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: RefAsyncData.SuccessComputed) => Success
    }
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, readonly A[]>>
  ) => Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure>> | readonly Fx.Fx.Success<Fx.Fx.FromInput<Success>>[]
  >
  <
    R,
    E,
    E1,
    A,
    B,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, readonly A[]>>,
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (data: RefAsyncData.LoadingComputed) => Loading
      Failure: (data: Computed.Computed<never, never, E1>, computed: RefAsyncData.FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: RefAsyncData.SuccessComputed) => Success
    }
  ): Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure>> | readonly Fx.Fx.Success<Fx.Fx.FromInput<Success>>[]
  >
}
```

Added in v1.18.0

## tagged

**Signature**

```ts
export declare const tagged: <E, A>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefAsyncDataArray.Tagged<IdentifierOf<I>, E, A>
  <const I>(identifier: string | I): RefAsyncDataArray.Tagged<IdentifierOf<I>, E, A>
}
```

Added in v1.18.0
