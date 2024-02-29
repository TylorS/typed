---
title: ParamsOf.ts
nav_order: 4
parent: "@typed/path"
---

## ParamsOf overview

Type-level parameter extraction of the path-to-regexp syntax

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ParamsOf (type alias)](#paramsof-type-alias)

---

# utils

## ParamsOf (type alias)

Extract the parameters from a path

**Signature**

```ts
export type ParamsOf<T extends string> = A.Equals<T, string> extends 1 ? {} : ToParams<ParseSegments<PathToSegments<T>>>
```

Added in v1.0.0
