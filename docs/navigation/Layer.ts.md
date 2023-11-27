---
title: Layer.ts
nav_order: 3
parent: "@typed/navigation"
---

## Layer overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Commit (type alias)](#commit-type-alias)
  - [InitialMemoryOptions (interface)](#initialmemoryoptions-interface)
  - [MemoryOptions (interface)](#memoryoptions-interface)
  - [fromWindow](#fromwindow)
  - [initialMemory](#initialmemory)
  - [memory](#memory)

---

# utils

## Commit (type alias)

**Signature**

```ts
export type Commit = (to: Destination, event: BeforeNavigationEvent) => Effect.Effect<never, NavigationError, void>
```

Added in v1.0.0

## InitialMemoryOptions (interface)

**Signature**

```ts
export interface InitialMemoryOptions {
  readonly url: string | URL
  readonly origin?: string | undefined
  readonly base?: string | undefined
  readonly maxEntries?: number | undefined
  readonly state?: unknown
  readonly commit?: Commit
}
```

Added in v1.0.0

## MemoryOptions (interface)

**Signature**

```ts
export interface MemoryOptions {
  readonly entries: ReadonlyArray<Destination>
  readonly origin?: string | undefined
  readonly base?: string | undefined
  readonly currentIndex?: number | undefined
  readonly maxEntries?: number | undefined
  readonly commit?: Commit
}
```

Added in v1.0.0

## fromWindow

**Signature**

```ts
export declare const fromWindow: Layer.Layer<Window, never, Navigation>
```

Added in v1.0.0

## initialMemory

**Signature**

```ts
export declare const initialMemory: (options: InitialMemoryOptions) => Layer.Layer<never, never, Navigation>
```

Added in v1.0.0

## memory

**Signature**

```ts
export declare const memory: (options: MemoryOptions) => Layer.Layer<never, never, Navigation>
```

Added in v1.0.0
