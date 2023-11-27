---
title: Hydrate.ts
nav_order: 8
parent: "@typed/template"
---

## Hydrate overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [hydrate](#hydrate)
  - [hydrateLayer](#hydratelayer)

---

# utils

## hydrate

**Signature**

```ts
export declare function hydrate<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
): Fx.Fx<Exclude<R, RenderTemplate> | Document | RenderContext | RootElement, E, ToRendered<T>>
```

Added in v1.0.0

## hydrateLayer

**Signature**

```ts
export declare function hydrateLayer<R, E, T extends RenderEvent | null>(rendered: Fx.Fx<R, E, T>)
```

Added in v1.0.0
