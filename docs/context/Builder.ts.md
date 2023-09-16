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

- [constructors](#constructors)
  - [ContextBuilder](#contextbuilder)
- [models](#models)
  - [ContextBuilder (interface)](#contextbuilder-interface)

---

# constructors

## ContextBuilder

**Signature**

```ts
export declare const ContextBuilder: {
  readonly empty: ContextBuilder<never>
  readonly fromContext: <I>(context: C.Context<I>) => ContextBuilder<I>
  readonly fromTag: <I, S>(tag: C.Tag<I, S>, s: S) => ContextBuilder<I>
}
```

Added in v1.0.0

# models

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
