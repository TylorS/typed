---
title: Emitter.ts
nav_order: 7
parent: "@typed/fx"
---

## Emitter overview

An Emitter is a a Sink-like type which is can be utilized to adapt external
APIs into an Fx.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
- [utils](#utils)
  - [Emitter (interface)](#emitter-interface)

---

# constructors

## make

Create an Emitter from a Sink

**Signature**

```ts
export declare function make<E, A>(sink: Sink.WithEarlyExit<E, A>): Effect.Effect<Scope.Scope, never, Emitter<E, A>>
```

Added in v1.18.0

# utils

## Emitter (interface)

An Emitter is a a Sink-like type which is can be utilized to adapt external
APIs into an Fx.

**Signature**

```ts
export interface Emitter<E, A> {
  (exit: Exit.Exit<E, A>): Fiber.Fiber<never, unknown>

  readonly succeed: (a: A) => Fiber.Fiber<never, unknown>
  readonly failCause: (e: Cause.Cause<E>) => Fiber.Fiber<never, unknown>
  readonly fail: (e: E) => Fiber.Fiber<never, unknown>
  readonly die: (e: unknown) => Fiber.Fiber<never, unknown>
  readonly end: () => Fiber.Fiber<never, unknown>
}
```

Added in v1.18.0
