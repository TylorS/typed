---
title: Stream.ts
nav_order: 17
parent: "@typed/fx"
---

## Stream overview

Additional Stream integrations with Fx.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [conversions](#conversions)
  - [fromStream](#fromstream)
  - [fromStreamChunked](#fromstreamchunked)
  - [toStream](#tostream)
  - [toStreamBounded](#tostreambounded)
  - [toStreamDropping](#tostreamdropping)
  - [toStreamQueued](#tostreamqueued)
  - [toStreamSliding](#tostreamsliding)

---

# conversions

## fromStream

Convert a Stream to an Fx

**Signature**

```ts
export declare function fromStream<A, E, R>(stream: Stream.Stream<A, E, R>): Fx.Fx<A, E, R>
```

Added in v1.18.0

## fromStreamChunked

Convert a Stream to an Fx of chunks

**Signature**

```ts
export declare function fromStreamChunked<A, E, R>(stream: Stream.Stream<A, E, R>): Fx.Fx<Chunk.Chunk<A>, E, R>
```

Added in v1.18.0

## toStream

Convert an Fx to a Stream

**Signature**

```ts
export declare function toStream<A, E, R>(fx: Fx.Fx<A, E, R>): Stream.Stream<A, E, R>
```

Added in v1.18.0

## toStreamBounded

Convert an Fx to a Stream using a bounded Queue to buffer values
that have not yet been pulled.

**Signature**

```ts
export declare const toStreamBounded: {
  (capacity: number): <A, E, R>(fx: Fx.Fx<A, E, R>) => Stream.Stream<A, E, R>
  <A, E, R>(fx: Fx.Fx<A, E, R>, capacity: number): Stream.Stream<A, E, R>
}
```

Added in v1.18.0

## toStreamDropping

Convert an Fx to a Stream using a dropping Queue to buffer values
that have not yet been pulled.

**Signature**

```ts
export declare const toStreamDropping: {
  (capacity: number): <A, E, R>(fx: Fx.Fx<A, E, R>) => Stream.Stream<A, E, R>
  <A, E, R>(fx: Fx.Fx<A, E, R>, capacity: number): Stream.Stream<A, E, R>
}
```

Added in v1.18.0

## toStreamQueued

Convert an Fx to a Stream using a Queue to buffer values
that have not yet been pulled.

**Signature**

```ts
export declare const toStreamQueued: {
  <E, A, R2, E2>(
    make: Effect.Effect<Queue.Queue<Exit.Exit<A, Option.Option<E>>>, E2, R2>
  ): <R>(fx: Fx.Fx<A, E, R>) => Stream.Stream<A, E | E2, R2 | R>
  <A, E, R, R2, E2>(
    fx: Fx.Fx<A, E, R>,
    make: Effect.Effect<Queue.Queue<Exit.Exit<A, Option.Option<E>>>, E2, R2>
  ): Stream.Stream<A, E | E2, R | R2>
}
```

Added in v1.18.0

## toStreamSliding

Convert an Fx to a Stream using a sliding Queue to buffer values
that have not yet been pulled.

**Signature**

```ts
export declare const toStreamSliding: {
  (capacity: number): <A, E, R>(fx: Fx.Fx<A, E, R>) => Stream.Stream<A, E, R>
  <A, E, R>(fx: Fx.Fx<A, E, R>, capacity: number): Stream.Stream<A, E, R>
}
```

Added in v1.18.0
