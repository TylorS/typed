---
title: Eq.ts
nav_order: 13
parent: Modules
---

## Eq overview

Eq instances for some common scenarios including deep equality.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Instance](#instance)
  - [alwaysEqualsEq](#alwaysequalseq)
  - [deepEqualsEq](#deepequalseq)
  - [neverEqualsEq](#neverequalseq)

---

# Instance

## alwaysEqualsEq

**Signature**

```ts
export declare const alwaysEqualsEq: Eq<any>
```

Added in v0.9.2

## deepEqualsEq

A deep-equality Eq instance.
Supports Reference equality, all JavaScript Primitives including `RegExp`, `Set` and `Map`.

**Signature**

```ts
export declare const deepEqualsEq: Eq<unknown>
```

Added in v0.9.2

## neverEqualsEq

**Signature**

```ts
export declare const neverEqualsEq: Eq<any>
```

Added in v0.9.2
