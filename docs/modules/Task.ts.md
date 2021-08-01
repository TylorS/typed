---
title: Task.ts
nav_order: 61
parent: Modules
---

## Task overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [chainRec](#chainrec)
- [Instance](#instance)
  - [ChainRec](#chainrec)
  - [MonadRec](#monadrec)

---

# Combinator

## chainRec

**Signature**

```ts
export declare const chainRec: <A, B>(
  f: (a: A) => T.Task<E.Either<A, B>>,
) => (value: A) => T.Task<B>
```

Added in v0.9.2

# Instance

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec1<'Task'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec1<'Task'>
```

Added in v0.9.2
