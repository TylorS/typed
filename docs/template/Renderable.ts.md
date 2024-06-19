---
title: Renderable.ts
nav_order: 18
parent: "@typed/template"
---

## Renderable overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Renderable (type alias)](#renderable-type-alias)
  - [Renderable (namespace)](#renderable-namespace)
    - [Primitive (type alias)](#primitive-type-alias)
    - [Value (type alias)](#value-type-alias)

---

# utils

## Renderable (type alias)

**Signature**

```ts
export type Renderable<E = never, R = never> =
  | Renderable.Value
  | Placeholder<any, E, R>
  | { readonly [key: string]: Renderable<E, R> | Placeholder<any, E, R> | unknown } // TODO: Should we manage data attributes this way?
  | Placeholder<any, E, R>
  | Effect<any, E, R>
  | Fx<any, E, R>
  | ReadonlyArray<Renderable<E, R>>
```

Added in v1.0.0

## Renderable (namespace)

Added in v1.0.0

### Primitive (type alias)

**Signature**

```ts
export type Primitive = string | number | boolean | null | undefined | void | ReadonlyArray<Primitive>
```

Added in v1.0.0

### Value (type alias)

**Signature**

```ts
export type Value = Primitive | Rendered | RenderEvent
```

Added in v1.0.0
