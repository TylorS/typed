---
title: Stream.ts
nav_order: 13
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
