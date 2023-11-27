---
title: Schema.ts
nav_order: 3
parent: "@typed/async-data"
---

## Schema overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [asyncData](#asyncdata)
  - [cause](#cause)

---

# utils

## asyncData

**Signature**

```ts
export declare const asyncData: <EI, E, AI, A>(
  error: Schema.Schema<EI, E>,
  value: Schema.Schema<AI, A>
) => Schema.Schema<AsyncData.AsyncData<EI, AI>, AsyncData.AsyncData<E, A>>
```

Added in v1.0.0

## cause

**Signature**

```ts
export declare const cause: <EI, E>(error: Schema.Schema<EI, E>) => Schema.Schema<Cause.Cause<EI>, Cause.Cause<E>>
```

Added in v1.0.0
