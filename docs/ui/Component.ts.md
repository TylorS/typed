---
title: Component.ts
nav_order: 2
parent: "@typed/ui"
---

## Component overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Component (interface)](#component-interface)

---

# utils

## Component (interface)

**Signature**

```ts
export interface Component<Props, R = never, E = never> {
  <P extends Props, Children extends ReadonlyArray<Renderable<any, any>>>(
    props: P,
    ...children: Children
  ): Fx<
    R | Scope.Scope | RenderTemplate | Placeholder.Context<P[keyof P] | Children[number]>,
    E | Placeholder.Error<P[keyof P] | Children[number]>,
    RenderEvent
  >
}
```

Added in v1.0.0
