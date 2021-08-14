---
title: Resume.ts
nav_order: 48
parent: Modules
---

## Resume overview

`Resume` is a possibly synchronous or asynchronous effect type. Conceptually you can think of
`Resume` as a union between the `IO` and `Task` monads w/ cancelation. The `Disposable` interface is
borrowed from `@most/core`'s internal types and makes it easy to interoperate. Using `Disposable`
makes it easy to reuse the `@most/scheduler` package for providing scheduling consistent with any
other most-based workflows you have.

The beauty of `Resume` is that it can do work as fast as possible without delay. Sync when possible
but async when needed allows you to unify your sync/async workflows using a single monad w/ easy
interop with your existing IO/Task allowing for cancelation when required.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [ap](#ap)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [chain](#chain)
  - [chainFirst](#chainfirst)
  - [chainFirstIOK](#chainfirstiok)
  - [chainFirstTaskK](#chainfirsttaskk)
  - [chainIOK](#chainiok)
  - [chainRec](#chainrec)
  - [chainTaskK](#chaintaskk)
  - [map](#map)
  - [race](#race)
  - [traverseReadonlyArray](#traversereadonlyarray)
  - [traverseReadonlyArrayWithIndex](#traversereadonlyarraywithindex)
  - [tupled](#tupled)
  - [zip](#zip)
- [Constructor](#constructor)
  - [Do](#do)
  - [async](#async)
  - [fromIO](#fromio)
  - [fromIOK](#fromiok)
  - [fromTask](#fromtask)
  - [fromTaskK](#fromtaskk)
  - [of](#of)
  - [sync](#sync)
- [Deconstructor](#deconstructor)
  - [exec](#exec)
  - [run](#run)
  - [start](#start)
  - [toTask](#totask)
- [Instance](#instance)
  - [Alt](#alt)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [FromIO](#fromio)
  - [FromTask](#fromtask)
  - [Functor](#functor)
  - [Monad](#monad)
  - [MonadRec](#monadrec)
  - [Pointed](#pointed)
- [Model](#model)
  - [Async (interface)](#async-interface)
  - [AsyncResume (type alias)](#asyncresume-type-alias)
  - [DisposablePromise (type alias)](#disposablepromise-type-alias)
  - [DisposableTask (type alias)](#disposabletask-type-alias)
  - [Resume (type alias)](#resume-type-alias)
  - [Sync (interface)](#sync-interface)
- [Refinement](#refinement)
  - [isAsync](#isasync)
  - [isSync](#issync)
- [Type-level](#type-level)
  - [ValueOf (type alias)](#valueof-type-alias)
- [Typeclass Constructor](#typeclass-constructor)
  - [getMonoid](#getmonoid)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## ap

**Signature**

```ts
export declare const ap: <A>(fa: Resume<A>) => <B>(fab: Resume<Arity1<A, B>>) => Resume<B>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Resume<B>,
) => (ma: Resume<A>) => Resume<{ readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(name: N) => <A>(fa: Resume<A>) => Resume<{ [K in N]: A }>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, B>(f: Arity1<A, Resume<B>>) => (resume: Resume<A>) => Resume<B>
```

Added in v0.9.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, B>(f: (a: A) => Resume<B>) => (first: Resume<A>) => Resume<A>
```

Added in v0.9.2

## chainFirstIOK

**Signature**

```ts
export declare const chainFirstIOK: <A, B>(f: (a: A) => IO<B>) => (first: Resume<A>) => Resume<A>
```

Added in v0.9.2

## chainFirstTaskK

**Signature**

```ts
export declare const chainFirstTaskK: <A, B>(
  f: (a: A) => Task<B>,
) => (first: Resume<A>) => Resume<A>
```

Added in v0.9.2

## chainIOK

**Signature**

```ts
export declare const chainIOK: <A, B>(f: (a: A) => IO<B>) => (first: Resume<A>) => Resume<B>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, B>(
  f: Arity1<A, Resume<E.Either<A, B>>>,
) => (value: A) => Resume<B>
```

Added in v0.9.2

## chainTaskK

**Signature**

```ts
export declare const chainTaskK: <A, B>(f: (a: A) => Task<B>) => (first: Resume<A>) => Resume<B>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(f: (a: A) => B) => (fa: Resume<A>) => Resume<B>
```

Added in v0.9.2

## race

**Signature**

```ts
export declare const race: <A>(ra: Resume<A>) => <B>(rb: Resume<B>) => Resume<A | B>
```

Added in v0.9.2

## traverseReadonlyArray

**Signature**

```ts
export declare const traverseReadonlyArray: <A, B>(
  f: (a: A) => Resume<B>,
) => (ta: readonly A[]) => Resume<readonly B[]>
```

Added in v0.9.2

## traverseReadonlyArrayWithIndex

**Signature**

```ts
export declare const traverseReadonlyArrayWithIndex: <A, B>(
  f: (i: number, a: A) => Resume<B>,
) => (ta: readonly A[]) => Resume<readonly B[]>
```

Added in v0.9.2

## tupled

**Signature**

```ts
export declare const tupled: <A>(fa: Resume<A>) => Resume<readonly [A]>
```

Added in v0.9.2

## zip

**Signature**

```ts
export declare const zip: <A>(ta: readonly Resume<A>[]) => Resume<readonly A[]>
```

Added in v0.9.2

# Constructor

## Do

**Signature**

```ts
export declare const Do: Resume<{}>
```

Added in v0.9.2

## async

**Signature**

```ts
export declare const async: <A>(resume: AsyncResume<A>) => Async<A>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: NaturalTransformation11<'IO', '@typed/fp/Resume'>
```

Added in v0.9.2

## fromIOK

**Signature**

```ts
export declare const fromIOK: <A, B>(f: (...a: A) => IO<B>) => (...a: A) => Resume<B>
```

Added in v0.9.2

## fromTask

**Signature**

```ts
export declare const fromTask: <A>(task: Task<A>) => Async<A>
```

Added in v0.9.2

## fromTaskK

**Signature**

```ts
export declare const fromTaskK: <A, B>(f: (...a: A) => Task<B>) => (...a: A) => Resume<B>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A>(a: A) => Sync<A>
```

Added in v0.9.2

## sync

**Signature**

```ts
export declare const sync: <A>(resume: IO<A>) => Sync<A>
```

Added in v0.9.2

# Deconstructor

## exec

**Signature**

```ts
export declare const exec: (resume: Resume<any>) => Disposable
```

Added in v0.9.2

## run

**Signature**

```ts
export declare const run: <A>(f: Arity1<A, Disposable>) => (resume: Resume<A>) => Disposable
```

Added in v0.9.2

## start

**Signature**

```ts
export declare const start: <A>(f: Arity1<A, any>) => (resume: Resume<A>) => Disposable
```

Added in v0.9.2

## toTask

**Signature**

```ts
export declare const toTask: <A>(resume: Resume<A>) => DisposableTask<A>
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt1<'@typed/fp/Resume'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative1<'@typed/fp/Resume'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply1<'@typed/fp/Resume'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Ch.Chain1<'@typed/fp/Resume'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec1<'@typed/fp/Resume'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FIO.FromIO1<'@typed/fp/Resume'>
```

Added in v0.9.2

## FromTask

**Signature**

```ts
export declare const FromTask: FT.FromTask1<'@typed/fp/Resume'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor1<'@typed/fp/Resume'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad1<'@typed/fp/Resume'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec1<'@typed/fp/Resume'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed1<'@typed/fp/Resume'>
```

Added in v0.9.2

# Model

## Async (interface)

**Signature**

```ts
export interface Async<A> {
  readonly _tag: 'async'
  readonly resume: AsyncResume<A>
}
```

Added in v0.9.2

## AsyncResume (type alias)

**Signature**

```ts
export type AsyncResume<A> = (resume: (value: A) => Disposable) => Disposable
```

Added in v0.9.2

## DisposablePromise (type alias)

**Signature**

```ts
export type DisposablePromise<A> = Promise<A> & Disposable
```

Added in v0.9.2

## DisposableTask (type alias)

**Signature**

```ts
export type DisposableTask<A> = () => DisposablePromise<A>
```

Added in v0.9.2

## Resume (type alias)

**Signature**

```ts
export type Resume<A> = Sync<A> | Async<A>
```

Added in v0.9.2

## Sync (interface)

**Signature**

```ts
export interface Sync<A> {
  readonly _tag: 'sync'
  readonly resume: IO<A>
}
```

Added in v0.9.2

# Refinement

## isAsync

**Signature**

```ts
export declare const isAsync: <A>(resume: Resume<A>) => resume is Async<A>
```

Added in v0.9.2

## isSync

**Signature**

```ts
export declare const isSync: <A>(resume: Resume<A>) => resume is Sync<A>
```

Added in v0.9.2

# Type-level

## ValueOf (type alias)

**Signature**

```ts
export type ValueOf<A> = [A] extends [Resume<infer R>] ? R : never
```

Added in v0.9.2

# Typeclass Constructor

## getMonoid

**Signature**

```ts
export declare const getMonoid: <A>(M: Monoid<A>) => Monoid<Resume<A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Resume'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
