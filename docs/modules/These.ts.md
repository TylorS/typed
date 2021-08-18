---
title: These.ts
nav_order: 76
parent: Modules
---

## These overview

These is an extension of fp-ts/These

Added in v0.12.1

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [absolve](#absolve)
  - [condemn](#condemn)

---

# Combinator

## absolve

Convert These<E, A> into an Either<E, A>. If the These is a Both<E, A> a Right<A> will be returned

**Signature**

```ts
export declare const absolve: <E, A>(these: TH.These<E, A>) => EI.Either<E, A>
```

Added in v0.12.1

## condemn

Convert These<E, A> into an Either<E, A>. If the These<E, A> is a Both<E, A> a Lef<E> will be
returned

**Signature**

```ts
export declare const condemn: <E, A>(these: TH.These<E, A>) => EI.Either<E, A>
```

Added in v0.12.1
