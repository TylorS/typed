---
title: GetRandomValues.ts
nav_order: 1
parent: "@typed/id"
---

## GetRandomValues overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [GetRandomValues](#getrandomvalues)
  - [GetRandomValues (type alias)](#getrandomvalues-type-alias)
  - [getRandomValues](#getrandomvalues-1)
  - [getRandomValuesNode](#getrandomvaluesnode)
  - [nodeCrypto](#nodecrypto)
  - [pseudoRandom](#pseudorandom)
  - [webCrypto](#webcrypto)

---

# utils

## GetRandomValues

**Signature**

```ts
export declare const GetRandomValues: Context.Fn<GetRandomValues, (length: number) => Effect.Effect<Uint8Array>>
```

Added in v1.0.0

## GetRandomValues (type alias)

**Signature**

```ts
export type GetRandomValues = Context.Fn.Identifier<typeof GetRandomValues>
```

Added in v1.0.0

## getRandomValues

**Signature**

```ts
export declare const getRandomValues: Layer.Layer<GetRandomValues, never, never>
```

Added in v1.0.0

## getRandomValuesNode

**Signature**

```ts
export declare const getRandomValuesNode: (crypto: typeof  length: number) => Uint8Array
```

Added in v1.0.0

## nodeCrypto

**Signature**

```ts
export declare const nodeCrypto: (crypto: typeof  => Layer.Layer<GetRandomValues>
```

Added in v1.0.0

## pseudoRandom

**Signature**

```ts
export declare const pseudoRandom: Layer.Layer<GetRandomValues, never, never>
```

Added in v1.0.0

## webCrypto

**Signature**

```ts
export declare const webCrypto: (crypto: Crypto) => Layer.Layer<GetRandomValues>
```

Added in v1.0.0
