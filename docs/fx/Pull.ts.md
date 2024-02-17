---
title: Pull.ts
nav_order: 10
parent: "@typed/fx"
---

## Pull overview

Pull is a data-type that really comes from the @effect/stream package, using
`Stream.toPull(stream)` to convert a Stream into an Effect which can be used
to read chunks of data from the Stream that are ready. This makes it a key part
of converting an Fx into a Stream.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Pull (interface)](#pull-interface)
  - [repeat](#repeat)
  - [schedule](#schedule)

---

# utils

## Pull (interface)

An Effect which can be used to pull values of a Stream.

**Signature**

```ts
export interface Pull<out R, out E, out A> extends Effect.Effect<Chunk.Chunk<A>, Option.Option<E>, R> {}
```

Added in v1.18.0

## repeat

Schedule the values of a Pull to be pushed into a Sink
using Effect.repeat.

**Signature**

```ts
export declare const repeat: {
  <R2, R3, E, A>(
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: Sink<R3, E, A>
  ): <R>(pull: Pull<R, E, A>) => Effect.Effect<unknown, never, R2 | R3 | R>
  <R, E, A, R2, R3>(
    pull: Pull<R, E, A>,
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: Sink<R3, E, A>
  ): Effect.Effect<unknown, never, R | R2 | R3>
}
```

Added in v1.18.0

## schedule

Schedule the values of a Pull to be pushed into a Sink
using Effect.schedule.

**Signature**

```ts
export declare const schedule: {
  <R2, R3, E, A>(
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: Sink<R3, E, A>
  ): <R>(pull: Pull<R, E, A>) => Effect.Effect<unknown, never, R2 | R3 | R>
  <R, E, A, R2, R3>(
    pull: Pull<R, E, A>,
    schedule: Schedule.Schedule<R2, unknown, unknown>,
    sink: Sink<R3, E, A>
  ): Effect.Effect<unknown, never, R | R2 | R3>
}
```

Added in v1.18.0
