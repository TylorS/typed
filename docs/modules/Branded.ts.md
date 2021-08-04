---
title: Branded.ts
nav_order: 2
parent: Modules
---

## Branded overview

Branded is a module to help you construct Branded types.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor](#constructor)
  - [Branded](#branded)
- [Model](#model)
  - [Branded (type alias)](#branded-type-alias)
- [Type-level](#type-level)
  - [BrandOf (type alias)](#brandof-type-alias)
  - [ValueOf (type alias)](#valueof-type-alias)

---

# Constructor

## Branded

**Signature**

```ts
export declare const Branded: <A extends unknown>() => <E extends ValueOf<A>>(
  e: E,
) => Branded<E, BrandOf<A>>
```

Added in v0.9.2

# Model

## Branded (type alias)

**Signature**

```ts
export type Branded<E, A> = E & { readonly __brand__: A }
```

Added in v0.9.2

# Type-level

## BrandOf (type alias)

**Signature**

```ts
export type BrandOf<A> = A extends Branded<infer _, infer R> ? R : never
```

Added in v0.9.2

## ValueOf (type alias)

**Signature**

```ts
export type ValueOf<A> = A extends infer E & { readonly __brand__: BrandOf<A> } ? E : never
```

Added in v0.9.2
