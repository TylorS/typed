---
title: MonadRec.ts
nav_order: 21
parent: Modules
---

## MonadRec overview

MonadRec is a Typeclass which is the intersecion between a Monad and ChainRec

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Typeclass](#typeclass)
  - [MonadRec (interface)](#monadrec-interface)
  - [MonadRec1 (interface)](#monadrec1-interface)
  - [MonadRec2 (interface)](#monadrec2-interface)
  - [MonadRec2C (interface)](#monadrec2c-interface)
  - [MonadRec3 (interface)](#monadrec3-interface)
  - [MonadRec4 (interface)](#monadrec4-interface)

---

# Typeclass

## MonadRec (interface)

**Signature**

```ts
export interface MonadRec<F> extends Monad<F>, ChainRec<F> {}
```

Added in v0.9.2

## MonadRec1 (interface)

**Signature**

```ts
export interface MonadRec1<F extends URIS> extends Monad1<F>, ChainRec1<F> {}
```

Added in v0.9.2

## MonadRec2 (interface)

**Signature**

```ts
export interface MonadRec2<F extends URIS2> extends Monad2<F>, ChainRec2<F> {}
```

Added in v0.9.2

## MonadRec2C (interface)

**Signature**

```ts
export interface MonadRec2C<F extends URIS2, E> extends Monad2C<F, E>, ChainRec2C<F, E> {}
```

Added in v0.9.2

## MonadRec3 (interface)

**Signature**

```ts
export interface MonadRec3<F extends URIS3> extends Monad3<F>, ChainRec3<F> {}
```

Added in v0.9.2

## MonadRec4 (interface)

**Signature**

```ts
export interface MonadRec4<F extends URIS4> extends Monad4<F>, ChainRec4<F> {}
```

Added in v0.9.2
