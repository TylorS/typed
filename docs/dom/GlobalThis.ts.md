---
title: GlobalThis.ts
nav_order: 4
parent: "@typed/dom"
---

## GlobalThis overview

Low-level Effect wrappers for globalThis and its usage via Context.

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [context](#context)
  - [GlobalThis](#globalthis)
- [models](#models)
  - [GlobalThis (interface)](#globalthis-interface)
- [utils](#utils)
  - [makeDOMParser](#makedomparser)

---

# context

## GlobalThis

A Context for the globalThis object

**Signature**

```ts
export declare const GlobalThis: any
```

Added in v8.19.0

# models

## GlobalThis (interface)

A Context for the globalThis object

**Signature**

```ts
export interface GlobalThis extends Identity<typeof globalThis> {}
```

Added in v8.19.0

# utils

## makeDOMParser

Construct a new DOMParser

**Signature**

```ts
export declare const makeDOMParser: Effect.Effect<GlobalThis, never, globalThis.DOMParser>
```

Added in v8.19.0
