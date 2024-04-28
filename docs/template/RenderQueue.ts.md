---
title: RenderQueue.ts
nav_order: 20
parent: "@typed/template"
---

## RenderQueue overview

The context in which templates are rendered within

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [DEFAULT_PRIORITY](#default_priority)
  - [IdleRenderQueueOptions (interface)](#idlerenderqueueoptions-interface)
  - [Priority](#priority)
  - [RenderQueue](#renderqueue)
  - [RenderQueue (interface)](#renderqueue-interface)
  - [currentPriority](#currentpriority)
  - [idle](#idle)
  - [microtask](#microtask)
  - [mixed](#mixed)
  - [raf](#raf)
  - [sync](#sync)
  - [unsafeMakeIdleRenderQueue](#unsafemakeidlerenderqueue)
  - [unsafeMakeMicrotaskRenderQueue](#unsafemakemicrotaskrenderqueue)
  - [unsafeMakeRafRenderQueue](#unsafemakerafrenderqueue)
  - [unsafeMakeSyncRenderQueue](#unsafemakesyncrenderqueue)
  - [usingCurrentPriority](#usingcurrentpriority)
  - [withCurrentPriority](#withcurrentpriority)

---

# utils

## DEFAULT_PRIORITY

**Signature**

```ts
export declare const DEFAULT_PRIORITY: 10
```

Added in v1.0.0

## IdleRenderQueueOptions (interface)

**Signature**

```ts
export interface IdleRenderQueueOptions extends IdleRequestOptions {
  readonly scope: Scope.Scope
}
```

Added in v1.0.0

## Priority

**Signature**

```ts
export declare const Priority: {
  readonly Sync: -1
  readonly MicroTask: (priority: number) => number
  readonly Raf: (priority: number) => number
  readonly Idle: (priority: number) => number
}
```

Added in v1.0.0

## RenderQueue

The context in which templates are rendered within

**Signature**

```ts
export declare const RenderQueue: Context.Tagged<RenderQueue, RenderQueue>
```

Added in v1.0.0

## RenderQueue (interface)

**Signature**

```ts
export interface RenderQueue {
  readonly add: (part: unknown, task: () => void, priority: number) => Effect.Effect<void, never, Scope.Scope>
}
```

Added in v1.0.0

## currentPriority

**Signature**

```ts
export declare const currentPriority: FiberRef.FiberRef<number>
```

Added in v1.0.0

## idle

**Signature**

```ts
export declare const idle: (options?: IdleRequestOptions) => Layer.Layer<RenderQueue>
```

Added in v1.0.0

## microtask

**Signature**

```ts
export declare const microtask: Layer.Layer<RenderQueue, never, never>
```

Added in v1.0.0

## mixed

**Signature**

```ts
export declare const mixed: (options?: IdleRequestOptions) => Layer.Layer<RenderQueue>
```

Added in v1.0.0

## raf

**Signature**

```ts
export declare const raf: Layer.Layer<RenderQueue, never, never>
```

Added in v1.0.0

## sync

**Signature**

```ts
export declare const sync: Layer.Layer<RenderQueue, never, never>
```

Added in v1.0.0

## unsafeMakeIdleRenderQueue

**Signature**

```ts
export declare const unsafeMakeIdleRenderQueue: ({ scope, ...options }: IdleRenderQueueOptions) => RenderQueue
```

Added in v1.0.0

## unsafeMakeMicrotaskRenderQueue

**Signature**

```ts
export declare const unsafeMakeMicrotaskRenderQueue: (scope: Scope.Scope) => RenderQueue
```

Added in v1.0.0

## unsafeMakeRafRenderQueue

**Signature**

```ts
export declare const unsafeMakeRafRenderQueue: (scope: Scope.Scope) => RenderQueue
```

Added in v1.0.0

## unsafeMakeSyncRenderQueue

**Signature**

```ts
export declare const unsafeMakeSyncRenderQueue: () => RenderQueue
```

Added in v1.0.0

## usingCurrentPriority

**Signature**

```ts
export declare const usingCurrentPriority: {
  (priority: number): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>
  <A, E, R>(effect: Effect.Effect<A, E, R>, priority: number): Effect.Effect<A, E, R>
}
```

Added in v1.0.0

## withCurrentPriority

**Signature**

```ts
export declare const withCurrentPriority: <A, E, R>(
  f: (priority: number) => Effect.Effect<A, E, R>
) => Effect.Effect<A, E, R>
```

Added in v1.0.0
