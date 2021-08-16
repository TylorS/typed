---
title: ReaderEither.ts
nav_order: 42
parent: Modules
---

## ReaderEither overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [chainRec](#chainrec)
  - [provideAll](#provideall)
  - [provideSome](#providesome)
  - [useAll](#useall)
  - [useSome](#usesome)
- [Instance](#instance)
  - [ChainRec](#chainrec)
  - [MonadRec](#monadrec)
  - [Provide](#provide)
  - [ProvideAll](#provideall)
  - [ProvideSome](#providesome)
  - [UseAll](#useall)
  - [UseSome](#usesome)

---

# Combinator

## chainRec

**Signature**

```ts
export declare const chainRec: <A, R, E, B>(
  f: (a: A) => RE.ReaderEither<R, E, Either<A, B>>,
) => (value: A) => RE.ReaderEither<R, E, B>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <R1>(
  provided: R1,
) => <E, A>(reader: RE.ReaderEither<R1, E, A>) => RE.ReaderEither<unknown, E, A>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <R1>(
  provided: R1,
) => <R2, E, A>(reader: RE.ReaderEither<R1 & R2, E, A>) => RE.ReaderEither<R2, E, A>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <R1>(
  provided: R1,
) => <E, A>(reader: RE.ReaderEither<R1, E, A>) => RE.ReaderEither<unknown, E, A>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <R1>(
  provided: R1,
) => <R2, E, A>(reader: RE.ReaderEither<R1 & R2, E, A>) => RE.ReaderEither<R2, E, A>
```

Added in v0.9.2

# Instance

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec3<'ReaderEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec3<'ReaderEither'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: Provide3<'ReaderEither'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: ProvideAll3<'ReaderEither'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: ProvideSome3<'ReaderEither'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: UseAll3<'ReaderEither'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: UseSome3<'ReaderEither'>
```

Added in v0.9.2
