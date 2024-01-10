---
title: Many.ts
nav_order: 10
parent: "@typed/template"
---

## Many overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [many](#many)
  - [manyAsyncData](#manyasyncdata)

---

# utils

## many

**Signature**

```ts
export declare function many<R, E, A, B extends PropertyKey, R2, E2>(
  values: Fx.Fx<R, E, ReadonlyArray<A>>,
  getKey: (a: NoInfer<A>) => B,
  f: (a: RefSubject.RefSubject<never, never, NoInfer<A>>, key: B) => Fx.Fx<R2, E2, RenderEvent>
): Fx.Fx<R | R2 | Scope.Scope | RenderContext, E | E2, RenderEvent | ReadonlyArray<RenderEvent>>
```

Added in v1.0.0

## manyAsyncData

**Signature**

```ts
export declare const manyAsyncData: {
  <
    E1,
    A,
    B extends PropertyKey,
    NoData extends Fx.Fx<any, any, any>,
    Loading extends Fx.Fx<any, any, any>,
    Failure extends Fx.Fx<any, any, any>,
    Success extends Fx.Fx<any, any, any>
  >(
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (todo: TODO) => Loading
      Failure: (data: RefSubject.Computed<never, never, E1>, computed: TODO) => Failure
      Success: (value: RefSubject.Computed<never, never, A>, computed: TODO) => Success
    }
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, readonly A[]>>
  ) => Fx.Fx<
    R | Fx.Fx.Context<NoData> | Fx.Fx.Context<Loading> | Fx.Fx.Context<Failure> | Fx.Fx.Context<Success>,
    E | Fx.Fx.Error<NoData> | Fx.Fx.Error<Loading> | Fx.Fx.Error<Failure> | Fx.Fx.Error<Success>,
    Fx.Fx.Success<NoData> | Fx.Fx.Success<Loading> | Fx.Fx.Success<Failure> | Fx.Fx.Success<Success>
  >
  <
    R,
    E,
    E1,
    A,
    B extends PropertyKey,
    NoData extends Fx.Fx<any, any, any>,
    Loading extends Fx.Fx<any, any, any>,
    Failure extends Fx.Fx<any, any, any>,
    Success extends Fx.Fx<any, any, any>
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, readonly A[]>>,
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (data: TODO) => Loading
      Failure: (data: RefSubject.Computed<never, never, E1>, computed: TODO) => Failure
      Success: (value: RefSubject.Computed<never, never, A>, computed: TODO) => Success
    }
  ): Fx.Fx<
    R | Fx.Fx.Context<NoData> | Fx.Fx.Context<Loading> | Fx.Fx.Context<Failure> | Fx.Fx.Context<Success>,
    E | Fx.Fx.Error<NoData> | Fx.Fx.Error<Loading> | Fx.Fx.Error<Failure> | Fx.Fx.Error<Success>,
    Fx.Fx.Success<NoData> | Fx.Fx.Success<Loading> | Fx.Fx.Success<Failure> | Fx.Fx.Success<Success>
  >
}
```

Added in v1.0.0
