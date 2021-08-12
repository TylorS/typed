---
title: Option.ts
nav_order: 32
parent: Modules
---

## Option overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [chainRec](#chainrec)
- [Typeclass](#typeclass)
  - [ChainRec](#chainrec)
  - [MonadRec](#monadrec)

---

# Combinator

## chainRec

**Signature**

```ts
export declare const chainRec: <A, B>(
  f: (value: A) => O.Option<E.Either<A, B>>,
) => (value: A) => O.Option<B>
```

Added in v0.9.2

# Typeclass

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec1<'Option'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec1<'Option'>
```

Added in v0.9.2
