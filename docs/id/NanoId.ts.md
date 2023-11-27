---
title: NanoId.ts
nav_order: 3
parent: "@typed/id"
---

## NanoId overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [NanoId](#nanoid)
  - [NanoId (type alias)](#nanoid-type-alias)
  - [NanoIdSeed (type alias)](#nanoidseed-type-alias)
  - [isNanoId](#isnanoid)
  - [makeNanoId](#makenanoid)
  - [makeNanoIdSeed](#makenanoidseed)
  - [nanoId](#nanoid-1)

---

# utils

## NanoId

**Signature**

```ts
export declare const NanoId: Brand.Brand.Constructor<NanoId>
```

Added in v1.0.0

## NanoId (type alias)

**Signature**

```ts
export type NanoId = string & Brand.Brand<"@typed/id/NanoId">
```

Added in v1.0.0

## NanoIdSeed (type alias)

**Signature**

```ts
export type NanoIdSeed = readonly [
  zero: number,
  one: number,
  two: number,
  three: number,
  four: number,
  five: number,
  six: number,
  seven: number,
  eight: number,
  nine: number,
  ten: number,
  eleven: number,
  twelve: number,
  thirteen: number,
  fourteen: number,
  fifteen: number,
  sixteen: number,
  seventeen: number,
  eighteen: number,
  nineteen: number,
  twenty: number
]
```

Added in v1.0.0

## isNanoId

**Signature**

```ts
export declare const isNanoId: (id: string) => id is NanoId
```

Added in v1.0.0

## makeNanoId

**Signature**

```ts
export declare const makeNanoId: Effect.Effect<GetRandomValues, never, NanoId>
```

Added in v1.0.0

## makeNanoIdSeed

**Signature**

```ts
export declare const makeNanoIdSeed: Effect.Effect<GetRandomValues, never, NanoIdSeed>
```

Added in v1.0.0

## nanoId

**Signature**

```ts
export declare const nanoId: (seed: NanoIdSeed) => NanoId
```

Added in v1.0.0
