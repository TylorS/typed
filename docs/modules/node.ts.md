---
title: node.ts
nav_order: 26
parent: Modules
---

## node overview

Added in v0.9.4

---

<h2 class="text-delta">Table of contents</h2>

- [Environment](#environment)
  - [HttpEnv](#httpenv)

---

# Environment

## HttpEnv

**Signature**

```ts
export declare const HttpEnv: {
  readonly http: (
    url: string,
    options?: http.HttpOptions | undefined,
  ) => E.Of<Ei.Either<Error, http.HttpResponse>>
}
```

Added in v0.9.4
