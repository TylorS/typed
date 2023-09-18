---
title: FxEffect.ts
nav_order: 8
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
  - [VersionedFxEffect (interface)](#versionedfxeffect-interface)

---

# utils

## FxEffect (interface)

A data type which is both an Fx and an Effect.

**Signature**

```ts
export interface FxEffect<R, E, A, R2, E2, B> extends Fx<R, E, A>, Omit<Effect<R2, E2, B>, TypeId> {}
```

Added in v1.18.0

## VersionedFxEffect (interface)

A data type which is both an Fx and an Effect. This is a more advanced types, and is the basis
for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
an at type which is both Fx + Effect.

**Signature**

```ts
export interface VersionedFxEffect<R0, R, E, A, R2, E2, B> extends FxEffect<R, E, A, R2, E2, B> {
  /**
   * Get the current value
   */
  readonly get: Effect<R2, E2, B>

  /**
   * The current version of this FxEffect. This is used to determine if the current value
   * is up to date to allow localized caching of value.
   */
  readonly version: Effect<R0, never, number>
}
```

Added in v1.18.0
