---
title: browser.ts
nav_order: 3
parent: Modules
---

## browser overview

Added in v0.9.4

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor](#constructor)
  - [broadcastChannel](#broadcastchannel)
  - [random16Bits](#random16bits)
  - [random32Bits](#random32bits)
  - [random8Bits](#random8bits)
- [Environment](#environment)
  - [HttpEnv](#httpenv)
  - [rafEnv](#rafenv)
  - [whenIdleEnv](#whenidleenv)

---

# Constructor

## broadcastChannel

Constructs an Adapter that utilizes a BroadcastChannel to communicate messages across all scripts of
the same origin, including workers.

_Note:_ An error will occur, and the stream will fail, if you send events which cannot be
structurally cloned. See
https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm

**Signature**

```ts
export declare const broadcastChannel: <A>(name: string) => readonly [(event: A) => void, Stream<A>]
```

Added in v0.12.2

## random16Bits

Utilize the Crypto API to generate 16-bit numbers

**Signature**

```ts
export declare const random16Bits: (count: number) => E.Of<readonly number[]>
```

Added in v0.12.2

## random32Bits

Utilize the Crypto API to generate 32-bit numbers

**Signature**

```ts
export declare const random32Bits: (count: number) => E.Of<readonly number[]>
```

Added in v0.12.2

## random8Bits

Utilize the Crypto API to generate 8-bit numbers

**Signature**

```ts
export declare const random8Bits: (count: number) => E.Of<readonly number[]>
```

Added in v0.12.2

# Environment

## HttpEnv

**Signature**

```ts
export declare const HttpEnv: {
  readonly http: (
    url: string,
    options?: http.HttpOptions | undefined,
  ) => E.Of<Ei.Either<Error, http.HttpResponse>>
}
```

Added in v0.9.4

## rafEnv

**Signature**

```ts
export declare const rafEnv: RafEnv
```

Added in v0.13.2

## whenIdleEnv

**Signature**

```ts
export declare const whenIdleEnv: WhenIdleEnv
```

Added in v0.13.2
