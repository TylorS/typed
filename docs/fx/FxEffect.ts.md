---
title: FxEffect.ts
nav_order: 4
parent: "@typed/fx"
---

## FxEffect overview

This module provides a data type which is both an Fx and an Effect. This is a more advanced types, and is the basis
for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
an at type which is both Fx + Effect.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [FxEffect (interface)](#fxeffect-interface)

---

# utils

## FxEffect (interface)

A data type which is both an Fx and an Effect. This is a more advanced types, and is the basis
for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
an at type which is both Fx + Effect.

**Signature**

```ts
export interface FxEffect<R, E, A, R2, E2, B> extends Fx<R, E, A>, Omit<Effect<R2, E2, B>, TypeId> {
  /**
   * The current version of this FxEffect. This is used to determine if the current value
   * is up to date to allow localized caching of value.
   */
  readonly version: () => number
}
```

Added in v1.18.0
