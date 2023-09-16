---
title: Builder.ts
nav_order: 1
parent: "@typed/context"
---

## Builder overview

ContextBuilder is a fluent interface for building and managing Contexts

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ContextBuilder (interface)](#contextbuilder-interface)
  - [ContextBuilder (namespace)](#contextbuilder-namespace)

---

# utils

## ContextBuilder (interface)

ContextBuilder is a fluent interface for building and managing Contexts

**Signature**

```ts
export interface ContextBuilder<I> {
  readonly context: C.Context<I>
  readonly add: <I2, S>(tag: C.Tag<I2, S>, s: S) => ContextBuilder<I | I2>
  readonly merge: <I2>(builder: ContextBuilder<I2>) => ContextBuilder<I | I2>
  readonly mergeContext: <I2>(context: C.Context<I2>) => ContextBuilder<I | I2>
  readonly pick: <S extends ReadonlyArray<C.ValidTagsById<I>>>(
    ...tags: S
  ) => ContextBuilder<C.Tag.Identifier<S[number]>>
}
```

Added in v1.0.0

## ContextBuilder (namespace)

Added in v1.0.0
