---
title: ReaderTaskEither.ts
nav_order: 40
parent: Modules
---

## ReaderTaskEither overview

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
  f: (value: A) => RTE.ReaderTaskEither<R, E, E.Either<A, B>>,
) => (value: A) => RTE.ReaderTaskEither<R, E, B>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <A>(
  provided: A,
) => <E, B>(hkt: RTE.ReaderTaskEither<Partial<A>, E, B>) => RTE.ReaderTaskEither<unknown, E, B>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <A>(
  provided: A,
) => <B, E, C>(hkt: RTE.ReaderTaskEither<A & B, E, C>) => RTE.ReaderTaskEither<B, E, C>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <A>(
  provided: A,
) => <E, B>(hkt: RTE.ReaderTaskEither<Partial<A>, E, B>) => RTE.ReaderTaskEither<unknown, E, B>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <A>(
  provided: A,
) => <B, E, C>(hkt: RTE.ReaderTaskEither<A & B, E, C>) => RTE.ReaderTaskEither<B, E, C>
```

Added in v0.9.2

# Instance

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec3<'ReaderTaskEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec3<'ReaderTaskEither'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: Provide3<'ReaderTaskEither'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: ProvideAll3<'ReaderTaskEither'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: ProvideSome3<'ReaderTaskEither'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: UseAll3<'ReaderTaskEither'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: UseSome3<'ReaderTaskEither'>
```

Added in v0.9.2
