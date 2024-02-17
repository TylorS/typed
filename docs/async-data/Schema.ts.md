---
title: Schema.ts
nav_order: 3
parent: "@typed/async-data"
---

## Schema overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AsyncDataFrom (type alias)](#asyncdatafrom-type-alias)
  - [FailureFrom (type alias)](#failurefrom-type-alias)
  - [LoadingFrom (type alias)](#loadingfrom-type-alias)
  - [NoDataFrom (type alias)](#nodatafrom-type-alias)
  - [OptimisticFrom (type alias)](#optimisticfrom-type-alias)
  - [Progress](#progress)
  - [ProgressFrom (type alias)](#progressfrom-type-alias)
  - [SuccessFrom (type alias)](#successfrom-type-alias)
  - [asyncData](#asyncdata)
  - [asyncDataFromJson](#asyncdatafromjson)
  - [asyncDataFromSelf](#asyncdatafromself)

---

# utils

## AsyncDataFrom (type alias)

**Signature**

```ts
export type AsyncDataFrom<A, E> = NoDataFrom | LoadingFrom | FailureFrom<E> | SuccessFrom<A> | OptimisticFrom<A, E>
```

Added in v1.0.0

## FailureFrom (type alias)

**Signature**

```ts
export type FailureFrom<E> = {
  readonly _tag: "Failure"
  readonly cause: Schema.CauseFrom<E>
  readonly timestamp: number
  readonly refreshing?: LoadingFrom | undefined
}
```

Added in v1.0.0

## LoadingFrom (type alias)

**Signature**

```ts
export type LoadingFrom = {
  readonly _tag: "Loading"
  readonly timestamp: number
  readonly progress?: ProgressFrom | undefined
}
```

Added in v1.0.0

## NoDataFrom (type alias)

**Signature**

```ts
export type NoDataFrom = { readonly _tag: "NoData" }
```

Added in v1.0.0

## OptimisticFrom (type alias)

**Signature**

```ts
export type OptimisticFrom<A, E> = {
  readonly timestamp: number
  readonly _tag: "Optimistic"
  readonly value: A
  readonly previous: AsyncDataFrom<A, E>
}
```

Added in v1.0.0

## Progress

**Signature**

```ts
export declare const Progress: Schema.Schema<
  P.Progress,
  { readonly loaded: string; readonly total?: string | undefined },
  never
>
```

Added in v1.0.0

## ProgressFrom (type alias)

**Signature**

```ts
export type ProgressFrom = {
  readonly loaded: string
  readonly total?: string | undefined
}
```

Added in v1.0.0

## SuccessFrom (type alias)

**Signature**

```ts
export type SuccessFrom<A> = {
  readonly timestamp: number
  readonly _tag: "Success"
  readonly value: A
  readonly refreshing?: LoadingFrom | undefined
}
```

Added in v1.0.0

## asyncData

**Signature**

```ts
export declare const asyncData: <A, AI, R1, E, EI, R2>(
  valueSchema: Schema.Schema<A, AI, R2>,
  errorSchema: Schema.Schema<E, EI, R1>
) => Schema.Schema<AsyncData.AsyncData<A, E>, AsyncDataFrom<AI, EI>, R1 | R2>
```

Added in v1.0.0

## asyncDataFromJson

**Signature**

```ts
export declare const asyncDataFromJson: <A, AI, R1, E, EI, R2>(
  value: Schema.Schema<A, AI, R1>,
  error: Schema.Schema<E, EI, R2>
) => Schema.Schema<AsyncDataFrom<A, E>, AsyncDataFrom<AI, EI>, R1 | R2>
```

Added in v1.0.0

## asyncDataFromSelf

**Signature**

```ts
export declare const asyncDataFromSelf: <A, AI, R1, E, EI, R2>(
  value: Schema.Schema<A, AI, R2>,
  error: Schema.Schema<E, EI, R1>
) => Schema.Schema<AsyncData.AsyncData<A, E>, AsyncData.AsyncData<AI, EI>, R1 | R2>
```

Added in v1.0.0
