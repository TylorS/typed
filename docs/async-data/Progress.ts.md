---
title: Progress.ts
nav_order: 2
parent: "@typed/async-data"
---

## Progress overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Progress](#progress)
  - [Progress (interface)](#progress-interface)
  - [equals](#equals)
  - [make](#make)
  - [pretty](#pretty)
  - [setLoaded](#setloaded)
  - [setTotal](#settotal)

---

# utils

## Progress

**Signature**

```ts
export declare function Progress(loaded: bigint, total: Option.Option<bigint> = Option.none()): Progress
```

Added in v1.0.0

## Progress (interface)

**Signature**

```ts
export interface Progress
  extends Data.Data<{
    readonly loaded: bigint
    readonly total: Option.Option<bigint>
  }> {}
```

Added in v1.0.0

## equals

**Signature**

```ts
export declare const equals: Equivalence.Equivalence<Progress>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: (loaded: bigint, total?: bigint | null) => Progress
```

Added in v1.0.0

## pretty

**Signature**

```ts
export declare function pretty(progress: Progress): string
```

Added in v1.0.0

## setLoaded

**Signature**

```ts
export declare const setLoaded: {
  (loaded: bigint): (progress: Progress) => Progress
  (progress: Progress, loaded: bigint): Progress
}
```

Added in v1.0.0

## setTotal

**Signature**

```ts
export declare const setTotal: {
  (total: bigint): (progress: Progress) => Progress
  (progress: Progress, total: bigint): Progress
}
```

Added in v1.0.0
