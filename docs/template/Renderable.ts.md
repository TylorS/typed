---
title: Renderable.ts
nav_order: 14
parent: "@typed/template"
---

## Renderable overview

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
  | { readonly [key: string]: Renderable.Value } // TODO: Should we manage data attributes this way?
  | Placeholder<R, E, Renderable.Value>
  | Effect<R, E, Renderable<R, E>>
  | ReadonlyArray<Renderable<R, E>>
```

## Renderable (namespace)

### Primitive (type alias)

**Signature**

```ts
export type Primitive = string | number | boolean | null | undefined | void | ReadonlyArray<Primitive>
```

### Value (type alias)

**Signature**

```ts
export type Value = Primitive | Rendered | RenderEvent
```
