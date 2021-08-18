---
title: StateReaderTaskEither.ts
nav_order: 67
parent: Modules
---

## StateReaderTaskEither overview

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
export declare const chainRec: <A, S, R, E, B>(
  f: Arity1<A, SRTE.StateReaderTaskEither<S, R, E, E.Either<A, B>>>,
) => (value: A) => SRTE.StateReaderTaskEither<S, R, E, B>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <R>(
  provided: R,
) => <S, E, A>(
  srte: SRTE.StateReaderTaskEither<S, R, E, A>,
) => SRTE.StateReaderTaskEither<S, unknown, E, A>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <R1>(
  provided: R1,
) => <S, R2, E, A>(
  srte: SRTE.StateReaderTaskEither<S, R1 & R2, E, A>,
) => SRTE.StateReaderTaskEither<S, R2, E, A>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <R>(
  provided: R,
) => <S, E, A>(
  srte: SRTE.StateReaderTaskEither<S, R, E, A>,
) => SRTE.StateReaderTaskEither<S, unknown, E, A>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <R1>(
  provided: R1,
) => <S, R2, E, A>(
  srte: SRTE.StateReaderTaskEither<S, R1 & R2, E, A>,
) => SRTE.StateReaderTaskEither<S, R2, E, A>
```

Added in v0.9.2

# Instance

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec4<'StateReaderTaskEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec4<'StateReaderTaskEither'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: Provide4<'StateReaderTaskEither'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: ProvideAll4<'StateReaderTaskEither'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: ProvideSome4<'StateReaderTaskEither'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: UseAll4<'StateReaderTaskEither'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: UseSome4<'StateReaderTaskEither'>
```

Added in v0.9.2
