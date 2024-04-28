---
title: Vite.ts
nav_order: 31
parent: "@typed/core"
---

## Vite overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [getHeadAndScript](#getheadandscript)

---

# utils

## getHeadAndScript

**Signature**

```ts
export declare function getHeadAndScript(
  entry: string,
  manifest: AssetManifest
): {
  readonly head: Fx.Fx<RenderEvent, never, RenderTemplate | RenderQueue.RenderQueue | Scope.Scope>
  readonly script: Fx.Fx<RenderEvent, never, RenderTemplate | RenderQueue.RenderQueue | Scope.Scope>
}
```

Added in v1.0.0
