---
title: TaskOption.ts
nav_order: 73
parent: Modules
---

## TaskOption overview

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
  f: (value: A) => TO.TaskOption<E.Either<A, B>>,
) => (value: A) => TO.TaskOption<B>
```

Added in v0.9.2

# Instance

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec1<'TaskOption'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec1<'TaskOption'>
```

Added in v0.9.2
