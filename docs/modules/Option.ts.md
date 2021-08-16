---
title: Option.ts
nav_order: 37
parent: Modules
---

## Option overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [chainRec](#chainrec)
- [Constructor](#constructor)
  - [struct](#struct)
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

# Constructor

## struct

**Signature**

```ts
export declare const struct: <Opts extends Readonly<Record<string, O.Option<any>>>>(
  opts: Opts,
) => O.Option<{ readonly [K in keyof Opts]: [Opts[K]] extends [O.Option<infer R>] ? R : never }>
```

Added in v0.12.1

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
