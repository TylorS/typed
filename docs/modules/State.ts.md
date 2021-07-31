---
title: State.ts
nav_order: 44
parent: Modules
---

## State overview

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
export declare const chainRec: <A, S, B>(
  f: (value: A) => S.State<S, E.Either<A, B>>,
) => (value: A) => S.State<S, B>
```

Added in v0.9.2

# Instance

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'State'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'State'>
```

Added in v0.9.2
