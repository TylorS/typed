---
title: IOEither.ts
nav_order: 24
parent: Modules
---

## IOEither overview

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
export declare const chainRec: <A, E, B>(
  f: (value: A) => IOE.IOEither<E, Either<A, B>>,
) => (value: A) => IOE.IOEither<E, B>
```

Added in v0.9.2

# Instance

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'IOEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'IOEither'>
```

Added in v0.9.2
