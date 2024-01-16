---
title: Emitter.ts
nav_order: 2
parent: "@typed/fx"
---

## Emitter overview

Emitter is a helper for creating Fx from external libraries which are not Effect-native.

Added in v1.20.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Emitter (interface)](#emitter-interface)
  - [withEmitter](#withemitter)

---

# utils

## Emitter (interface)

**Signature**

```ts
export interface Emitter<in E, in A> {
  readonly succeed: (value: A) => Promise<Exit.Exit<never, unknown>>
  readonly failCause: (cause: Cause.Cause<E>) => Promise<Exit.Exit<never, unknown>>
  readonly fail: (error: E) => Promise<Exit.Exit<never, unknown>>
  readonly die: (error: unknown) => Promise<Exit.Exit<never, unknown>>
  readonly end: () => Promise<Exit.Exit<never, unknown>>
}
```

Added in v1.20.0

## withEmitter

**Signature**

```ts
export declare function withEmitter<R, E, A, R2, B>(
  sink: Sink.Sink<R, E, A>,
  f: (emitter: Emitter<E, A>) => Effect.Effect<R2, E, B>
): Effect.Effect<R | R2, never, void>
```

Added in v1.20.0
