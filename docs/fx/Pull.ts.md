---
title: Pull.ts
nav_order: 9
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
export interface Pull<out A, out E = never, out R = never> extends Effect.Effect<Chunk.Chunk<A>, Option.Option<E>, R> {}
```

Added in v1.18.0

## repeat

Schedule the values of a Pull to be pushed into a Sink
using Effect.repeat.

**Signature**

```ts
export declare const repeat: {
  <R2, A, E, R3>(
    schedule: Schedule.Schedule<unknown, unknown, R2>,
    sink: Sink<A, E, R3>
  ): <R>(pull: Pull<A, E, R>) => Effect.Effect<unknown, never, R | R2 | R3>
  <A, E, R, R2, R3>(
    pull: Pull<A, E, R>,
    schedule: Schedule.Schedule<unknown, unknown, R2>,
    sink: Sink<A, E, R3>
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
  <R2, A, E, R3>(
    schedule: Schedule.Schedule<unknown, unknown, R2>,
    sink: Sink<A, E, R3>
  ): <R>(pull: Pull<A, E, R>) => Effect.Effect<unknown, never, R | R2 | R3>
  <A, E, R, R2, R3>(
    pull: Pull<A, E, R>,
    schedule: Schedule.Schedule<unknown, unknown, R2>,
    sink: Sink<A, E, R3>
  ): Effect.Effect<unknown, never, R | R2 | R3>
}
```

Added in v1.18.0
