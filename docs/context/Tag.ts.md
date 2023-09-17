---
title: Tag.ts
nav_order: 25
parent: "@typed/context"
---

## Tag overview

Small wrapper around @effect/data/Context.Tag to allow
creating opaque identifiers for your services.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Tag](#tag)
  - [Tag (interface)](#tag-interface)
  - [Tag (namespace)](#tag-namespace)
    - [Identifier (type alias)](#identifier-type-alias)
    - [Service (type alias)](#service-type-alias)

---

# utils

## Tag

Construct a Tag implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Tag<const I extends IdentifierFactory<any>, S = I>(id: I | string): Tag<IdentifierOf<I>, S>
export declare function Tag<const I, S = I>(id: I | string): Tag<IdentifierOf<I>, S>
export declare function Tag<const I, S>(id: I): Tag<IdentifierOf<I>, S>
export declare function Tag<S>(): {
  <const I extends IdentifierFactory<any>>(id: I): Tag<IdentifierOf<I>, S>
  <const I>(id: I | string): Tag<IdentifierOf<I>, S>
}
```

Added in v1.0.0

## Tag (interface)

Provides extensions to the `Context` module's Tag implementation to
provide a more ergonomic API for working with Effect + Fx.

**Signature**

```ts
export interface Tag<I, S = I> extends C.Tag<I, S> {}
```

Added in v1.0.0

## Tag (namespace)

Added in v1.0.0

### Identifier (type alias)

Extract the Identifier of a Tag

**Signature**

```ts
export type Identifier<T> = [T] extends [C.Tag<infer I, infer _>]
  ? I
  : [T] extends [Tagged<infer I, infer _>]
  ? I
  : never
```

Added in v1.0.0

### Service (type alias)

Extract the Service of a Tag

**Signature**

```ts
export type Service<T> = [T] extends [C.Tag<infer _, infer S>] ? S : [T] extends [Tagged<infer _, infer S>] ? S : never
```

Added in v1.0.0
