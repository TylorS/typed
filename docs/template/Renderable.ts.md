---
title: Renderable.ts
nav_order: 17
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
export type Renderable<R = never, E = never> =
  | Renderable.Value
  | Placeholder<R, E, any>
  | { readonly [key: string]: Renderable<R, E> | Placeholder<R, E, any> | unknown } // TODO: Should we manage data attributes this way?
  | Placeholder<R, E, any>
  | Effect<R, E, any>
  | Fx<R, E, any>
  | ReadonlyArray<Renderable<R, E>>
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
