---
title: Interpolate.ts
nav_order: 3
parent: "@typed/path"
---

## Interpolate overview

Type-level interpolation of the path-to-regexp syntax

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Interpolate (type alias)](#interpolate-type-alias)

---

# utils

## Interpolate (type alias)

Interpolate a path with parameters

**Signature**

```ts
export type Interpolate<P extends string, Params extends ParamsOf<P>> =
  A.Equals<P, string> extends 1 ? string : PathJoin<InterpolateParts<ParseSegments<PathToSegments<P>>, Params>>
```

Added in v1.0.0
