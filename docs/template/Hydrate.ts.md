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
  rendered: Fx.Fx<T, E, R>
): Fx.Fx<ToRendered<T>, E, Exclude<R, RenderTemplate> | Document | RenderContext | RootElement>
```

Added in v1.0.0

## hydrateLayer

**Signature**

```ts
export declare function hydrateLayer<R, E, T extends RenderEvent | null>(rendered: Fx.Fx<T, E, R>)
```

Added in v1.0.0
