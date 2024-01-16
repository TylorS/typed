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
  - [Failure](#failure)
  - [FailureFrom (type alias)](#failurefrom-type-alias)
  - [Loading](#loading)
  - [LoadingFrom (type alias)](#loadingfrom-type-alias)
  - [NoData](#nodata)
  - [NoDataFrom (type alias)](#nodatafrom-type-alias)
  - [Progress](#progress)
  - [ProgressFrom (type alias)](#progressfrom-type-alias)
  - [Success](#success)
  - [SuccessFrom (type alias)](#successfrom-type-alias)
  - [asyncData](#asyncdata)
  - [asyncDataFromSelf](#asyncdatafromself)

---

# utils

## AsyncDataFrom (type alias)

**Signature**

```ts
export type AsyncDataFrom<E, A> = NoDataFrom | LoadingFrom | FailureFrom<E> | SuccessFrom<A>
```

Added in v1.0.0

## Failure

**Signature**

```ts
export declare const Failure: <EI, E>(
  error: Schema.Schema<EI, E>
) => Schema.Schema<
  {
    readonly _tag: "Failure"
    readonly cause: Schema.CauseFrom<EI>
    readonly timestamp: number
    readonly refreshing?:
      | {
          readonly _tag: "Loading"
          readonly timestamp: number
          readonly progress?: { readonly loaded: string; readonly total?: string | undefined } | undefined
        }
      | undefined
  },
  AsyncData.Failure<E>
>
```

Added in v1.0.0

## FailureFrom (type alias)

**Signature**

```ts
export type FailureFrom<E> = Schema.Schema.From<ReturnType<typeof FailureSchemaJson<E, E>>>
```

Added in v1.0.0

## Loading

**Signature**

```ts
export declare const Loading: Schema.Schema<
  { readonly _tag: "Loading"; readonly timestamp: number; readonly progress?: ProgressFrom | undefined },
  AsyncData.Loading
>
```

Added in v1.0.0

## LoadingFrom (type alias)

**Signature**

```ts
export type LoadingFrom = Schema.Schema.From<typeof Loading>
```

Added in v1.0.0

## NoData

**Signature**

```ts
export declare const NoData: Schema.Schema<{ readonly _tag: "NoData" }, AsyncData.NoData>
```

Added in v1.0.0

## NoDataFrom (type alias)

**Signature**

```ts
export type NoDataFrom = Schema.Schema.From<typeof NoData>
```

Added in v1.0.0

## Progress

**Signature**

```ts
export declare const Progress: Schema.Schema<
  { readonly loaded: string; readonly total?: string | undefined },
  P.Progress
>
```

Added in v1.0.0

## ProgressFrom (type alias)

**Signature**

```ts
export type ProgressFrom = Schema.Schema.From<typeof Progress>
```

Added in v1.0.0

## Success

**Signature**

```ts
export declare const Success: <AI, A>(
  value: Schema.Schema<AI, A>
) => Schema.Schema<
  {
    readonly timestamp: number
    readonly _tag: "Success"
    readonly value: AI
    readonly refreshing?: LoadingFrom | undefined
  },
  AsyncData.Success<A>
>
```

Added in v1.0.0

## SuccessFrom (type alias)

**Signature**

```ts
export type SuccessFrom<A> = Schema.Schema.From<ReturnType<typeof SuccessSchemaJson<A, A>>>
```

Added in v1.0.0

## asyncData

**Signature**

```ts
export declare const asyncData: <EI, E, AI, A>(
  error: Schema.Schema<EI, E>,
  value: Schema.Schema<AI, A>
) => Schema.Schema<AsyncDataFrom<EI, AI>, AsyncData.AsyncData<E, A>>
```

Added in v1.0.0

## asyncDataFromSelf

**Signature**

```ts
export declare const asyncDataFromSelf: <EI, E, AI, A>(
  error: Schema.Schema<EI, E>,
  value: Schema.Schema<AI, A>
) => Schema.Schema<AsyncData.AsyncData<EI, AI>, AsyncData.AsyncData<E, A>>
```

Added in v1.0.0
