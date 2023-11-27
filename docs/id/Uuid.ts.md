---
title: Uuid.ts
nav_order: 5
parent: "@typed/id"
---

## Uuid overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Uuid](#uuid)
  - [Uuid (type alias)](#uuid-type-alias)
  - [UuidSeed (type alias)](#uuidseed-type-alias)
  - [isUuid](#isuuid)
  - [makeUuid](#makeuuid)
  - [makeUuidSeed](#makeuuidseed)
  - [uuid4](#uuid4)

---

# utils

## Uuid

**Signature**

```ts
export declare const Uuid: Brand.Brand.Constructor<Uuid>
```

Added in v1.0.0

## Uuid (type alias)

**Signature**

```ts
export type Uuid = string & Brand.Brand<"@typed/id/UUID">
```

Added in v1.0.0

## UuidSeed (type alias)

**Signature**

```ts
export type UuidSeed = readonly [
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
  fifteen: number
]
```

Added in v1.0.0

## isUuid

Returns `true` if a string is a UUID.

**Signature**

```ts
export declare const isUuid: (value: string) => value is Uuid
```

Added in v1.0.0

## makeUuid

**Signature**

```ts
export declare const makeUuid: Effect.Effect<GetRandomValues, never, Uuid>
```

Added in v1.0.0

## makeUuidSeed

**Signature**

```ts
export declare const makeUuidSeed: Effect.Effect<GetRandomValues, never, UuidSeed>
```

Added in v1.0.0

## uuid4

**Signature**

```ts
export declare function uuid4(seed: UuidSeed): Uuid
```

Added in v1.0.0
