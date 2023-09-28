---
title: Stream.ts
nav_order: 18
parent: "@typed/fx"
---

## Stream overview

Additional Stream integrations with Fx.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [conversions](#conversions)
  - [chunked](#chunked)
  - [toStream](#tostream)
  - [toStreamBounded](#tostreambounded)
  - [toStreamDropping](#tostreamdropping)
  - [toStreamQueued](#tostreamqueued)
  - [toStreamSliding](#tostreamsliding)

---

# conversions

## chunked

Convert a Stream to an Fx of chunks

**Signature**

```ts
export declare function chunked<R, E, A>(stream: Stream.Stream<R, E, A>): Fx.Fx<R, E, Chunk.Chunk<A>>
```

Added in v1.18.0

## toStream

Convert an Fx to a Stream

**Signature**

```ts
export declare function toStream<R, E, A>(fx: Fx.Fx<R, E, A>): Stream.Stream<R, E, A>
```

Added in v1.18.0

## toStreamBounded

Convert an Fx to a Stream using a bounded Queue to buffer values
that have not yet been pulled.

**Signature**

```ts
export declare const toStreamBounded: {
  (capacity: number): <R, E, A>(fx: Fx.Fx<R, E, A>) => Stream.Stream<R, E, A>
  <R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number): Stream.Stream<R, E, A>
}
```

Added in v1.18.0

## toStreamDropping

Convert an Fx to a Stream using a dropping Queue to buffer values
that have not yet been pulled.

**Signature**

```ts
export declare const toStreamDropping: {
  (capacity: number): <R, E, A>(fx: Fx.Fx<R, E, A>) => Stream.Stream<R, E, A>
  <R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number): Stream.Stream<R, E, A>
}
```

Added in v1.18.0

## toStreamQueued

Convert an Fx to a Stream using a Queue to buffer values
that have not yet been pulled.

**Signature**

```ts
export declare const toStreamQueued: {
  <E, A, R2, E2>(make: Effect.Effect<R2, E2, Queue.Queue<Exit.Exit<Option.Option<E>, A>>>): <R>(
    fx: Fx.Fx<R, E, A>
  ) => Stream.Stream<R2 | R, E | E2, A>
  <R, E, A, R2, E2>(
    fx: Fx.Fx<R, E, A>,
    make: Effect.Effect<R2, E2, Queue.Queue<Exit.Exit<Option.Option<E>, A>>>
  ): Stream.Stream<R | R2, E | E2, A>
}
```

Added in v1.18.0

## toStreamSliding

Convert an Fx to a Stream using a sliding Queue to buffer values
that have not yet been pulled.

**Signature**

```ts
export declare const toStreamSliding: {
  (capacity: number): <R, E, A>(fx: Fx.Fx<R, E, A>) => Stream.Stream<R, E, A>
  <R, E, A>(fx: Fx.Fx<R, E, A>, capacity: number): Stream.Stream<R, E, A>
}
```

Added in v1.18.0
