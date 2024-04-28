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
export declare function many<A, E, R, B extends PropertyKey, R2, E2>(
  values: Fx.Fx<ReadonlyArray<A>, E, R>,
  getKey: (a: NoInfer<A>) => B,
  f: (a: RefSubject.RefSubject<A>, key: B) => Fx.Fx<RenderEvent, E2, R2>
): Fx.Fx<RenderEvent | ReadonlyArray<RenderEvent>, E | E2, R | R2 | Scope.Scope | RenderContext>
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
      Loading: (data: RefSubject.Filtered<Progress>) => Loading
      Failure: (data: RefSubject.Computed<E1, never, never>) => Failure
      Success: (value: RefSubject.Computed<A, never, never>) => Success
    }
  ): <E, R>(
    fx: Fx.Fx<AsyncData.AsyncData<readonly A[], E1>, E, R>
  ) => Fx.Fx<
    Fx.Fx.Success<NoData> | Fx.Fx.Success<Loading> | Fx.Fx.Success<Failure> | Fx.Fx.Success<Success>,
    E | Fx.Fx.Error<NoData> | Fx.Fx.Error<Loading> | Fx.Fx.Error<Failure> | Fx.Fx.Error<Success>,
    R | Fx.Fx.Context<NoData> | Fx.Fx.Context<Loading> | Fx.Fx.Context<Failure> | Fx.Fx.Context<Success>
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
    fx: Fx.Fx<AsyncData.AsyncData<readonly A[], E1>, E, R>,
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (data: RefSubject.Filtered<Progress>) => Loading
      Failure: (data: RefSubject.Computed<E1, never, never>) => Failure
      Success: (value: RefSubject.Computed<A, never, never>) => Success
    }
  ): Fx.Fx<
    Fx.Fx.Success<NoData> | Fx.Fx.Success<Loading> | Fx.Fx.Success<Failure> | Fx.Fx.Success<Success>,
    E | Fx.Fx.Error<NoData> | Fx.Fx.Error<Loading> | Fx.Fx.Error<Failure> | Fx.Fx.Error<Success>,
    R | Fx.Fx.Context<NoData> | Fx.Fx.Context<Loading> | Fx.Fx.Context<Failure> | Fx.Fx.Context<Success>
  >
}
```

Added in v1.0.0
