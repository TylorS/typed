---
title: struct.ts
nav_order: 59
parent: Modules
---

## struct overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor](#constructor)
  - [make](#make)

---

# Constructor

## make

**Signature**

```ts
export declare function make<K extends PropertyKey, V>(key: K, value: V): { readonly [_ in K]: V }
```

Added in v0.9.2
