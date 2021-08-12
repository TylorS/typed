---
title: Ref.ts
nav_order: 43
parent: Modules
---

## Ref overview

`Ref` is an abstraction for managing state-based applications using [Env](./Env.ts.md).

The provided implementation will also send events containing all of the creations/updates/deletes
occurring in real-time.

Added in v0.11.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [ap](#ap)
  - [apFirst](#apfirst)
  - [apFirstW](#apfirstw)
  - [apS](#aps)
  - [apSW](#apsw)
  - [apSecond](#apsecond)
  - [apSecondW](#apsecondw)
  - [apT](#apt)
  - [apTW](#aptw)
  - [chainEnvK](#chainenvk)
  - [chainFirstEnvK](#chainfirstenvk)
  - [chainFirstIOK](#chainfirstiok)
  - [chainFirstReaderK](#chainfirstreaderk)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainFirstTaskK](#chainfirsttaskk)
  - [chainIOK](#chainiok)
  - [chainReaderK](#chainreaderk)
  - [chainResumeK](#chainresumek)
  - [chainTaskK](#chaintaskk)
  - [combineStruct](#combinestruct)
  - [compose](#compose)
  - [local](#local)
  - [map](#map)
  - [promap](#promap)
  - [provideAll](#provideall)
  - [provideSome](#providesome)
  - [useAll](#useall)
  - [useSome](#usesome)
- [Constructor](#constructor)
  - [fromKV](#fromkv)
  - [kv](#kv)
- [Instance](#instance)
  - [Apply](#apply)
  - [Functor](#functor)
  - [Profunctor](#profunctor)
  - [Provide](#provide)
  - [ProvideAll](#provideall)
  - [ProvideSome](#providesome)
  - [Semigroupoid](#semigroupoid)
  - [UseAll](#useall)
  - [UseSome](#usesome)
- [Instance Constructor](#instance-constructor)
  - [getFromKV](#getfromkv)
- [Model](#model)
  - [Ref (interface)](#ref-interface)
- [Type-level](#type-level)
  - [InputOf (type alias)](#inputof-type-alias)
  - [OutputOf (type alias)](#outputof-type-alias)
  - [RequirementsOf (type alias)](#requirementsof-type-alias)
- [Typeclass Constructor](#typeclass-constructor)
  - [getApplySemigroup](#getapplysemigroup)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## ap

**Signature**

```ts
export declare const ap: <E1, I, A>(
  fa: Ref<E1, I, A>,
) => <E2, B>(fab: Ref<E2, I, (value: A) => B>) => Ref<E1 & E2, I, B>
```

Added in v0.11.0

## apFirst

**Signature**

```ts
export declare const apFirst: <R, E, B>(
  second: Ref<R, E, B>,
) => <A>(first: Ref<R, E, A>) => Ref<R, E, A>
```

Added in v0.11.0

## apFirstW

**Signature**

```ts
export declare const apFirstW: <R1, E, B>(
  second: Ref<R1, E, B>,
) => <R2, A>(first: Ref<R2, E, A>) => Ref<R1 & R2, E, A>
```

Added in v0.11.0

## apS

**Signature**

```ts
export declare const apS: <N, A, R, E, B>(
  name: Exclude<N, keyof A>,
  fb: Ref<R, E, B>,
) => (fa: Ref<R, E, A>) => Ref<R, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.11.0

## apSW

**Signature**

```ts
export declare const apSW: <N extends string, A, R1, E, B>(
  name: Exclude<N, keyof A>,
  fb: Ref<R1, E, B>,
) => <R2>(
  fa: Ref<R2, E, A>,
) => Ref<R1 & R2, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.11.0

## apSecond

**Signature**

```ts
export declare const apSecond: <R, E, B>(
  second: Ref<R, E, B>,
) => <A>(first: Ref<R, E, A>) => Ref<R, E, B>
```

Added in v0.11.0

## apSecondW

**Signature**

```ts
export declare const apSecondW: <R1, E, B>(
  second: Ref<R1, E, B>,
) => <R2, A>(first: Ref<R2, E, A>) => Ref<R1 & R2, E, B>
```

Added in v0.11.0

## apT

**Signature**

```ts
export declare const apT: <R, E, B>(
  fb: Ref<R, E, B>,
) => <A>(fas: Ref<R, E, A>) => Ref<R, E, readonly [...A, B]>
```

Added in v0.11.0

## apTW

**Signature**

```ts
export declare const apTW: <R1, E, B>(
  fb: Ref<R1, E, B>,
) => <R2, A extends readonly unknown[]>(fas: Ref<R2, E, A>) => Ref<R1 & R2, E, readonly [...A, B]>
```

Added in v0.11.0

## chainEnvK

**Signature**

```ts
export declare function chainEnvK<A, E1, B>(f: (value: A) => E.Env<E1, B>)
```

Added in v0.11.0

## chainFirstEnvK

**Signature**

```ts
export declare function chainFirstEnvK<A, E1, B>(f: (value: A) => E.Env<E1, B>)
```

Added in v0.11.0

## chainFirstIOK

**Signature**

```ts
export declare function chainFirstIOK<A, B>(f: (value: A) => IO<B>)
```

Added in v0.11.0

## chainFirstReaderK

**Signature**

```ts
export declare function chainFirstReaderK<A, E1, B>(f: (value: A) => Reader<E1, B>)
```

Added in v0.11.0

## chainFirstResumeK

**Signature**

```ts
export declare function chainFirstResumeK<A, B>(f: (value: A) => Resume<B>)
```

Added in v0.11.0

## chainFirstTaskK

**Signature**

```ts
export declare function chainFirstTaskK<A, B>(f: (value: A) => Task<B>)
```

Added in v0.11.0

## chainIOK

**Signature**

```ts
export declare function chainIOK<A, B>(f: (value: A) => IO<B>)
```

Added in v0.11.0

## chainReaderK

**Signature**

```ts
export declare function chainReaderK<A, E1, B>(f: (value: A) => Reader<E1, B>)
```

Added in v0.11.0

## chainResumeK

**Signature**

```ts
export declare function chainResumeK<A, B>(f: (value: A) => Resume<B>)
```

Added in v0.11.0

## chainTaskK

**Signature**

```ts
export declare function chainTaskK<A, B>(f: (value: A) => Task<B>)
```

Added in v0.11.0

## combineStruct

**Signature**

```ts
export declare function combineStruct<S extends AnyRefStruct>(
  properties: S,
): Ref<RefStructEnv<S>, RefStructInput<S>, RefStructOutput<S>>
```

Added in v0.11.0

## compose

**Signature**

```ts
export declare const compose: <E2, A, O>(
  second: Ref<E2, A, O>,
) => <E1, I>(first: Ref<E1, I, A>) => Ref<E1 & E2, I, O>
```

Added in v0.11.0

## local

**Signature**

```ts
export declare const local: <A, B>(f: (value: A) => B) => <E, C>(ref: Ref<E, B, C>) => Ref<E, A, C>
```

Added in v0.11.0

## map

**Signature**

```ts
export declare const map: <A, B>(f: (value: A) => B) => <E, I>(ref: Ref<E, I, A>) => Ref<E, I, B>
```

Added in v0.11.0

## promap

**Signature**

```ts
export declare const promap: <B, A, C, D>(
  f: (value: B) => A,
  g: (value: C) => D,
) => <E>(ref: Ref<E, A, C>) => Ref<E, B, D>
```

Added in v0.11.0

## provideAll

**Signature**

```ts
export declare const provideAll: <E>(provided: E) => <A, B>(ref: Ref<E, A, B>) => Ref<unknown, A, B>
```

Added in v0.11.0

## provideSome

**Signature**

```ts
export declare const provideSome: <E1>(
  provided: E1,
) => <E2, A, B>(ref: Ref<E1 & E2, A, B>) => Ref<E2, A, B>
```

Added in v0.11.0

## useAll

**Signature**

```ts
export declare const useAll: <E1>(provided: E1) => <A, B>(ref: Ref<E1, A, B>) => Ref<unknown, A, B>
```

Added in v0.11.0

## useSome

**Signature**

```ts
export declare const useSome: <E1>(
  provided: E1,
) => <E2, A, B>(ref: Ref<E1 & E2, A, B>) => Ref<E2, A, B>
```

Added in v0.11.0

# Constructor

## fromKV

**Signature**

```ts
export declare const fromKV: <K, E, A>(
  kv: KV.KV<K, E, A>,
) => KV.KV<K, E, A> & Ref<E & KV.Env<K>, A, A>
```

Added in v0.11.0

## kv

**Signature**

```ts
export declare const kv: <E, A, K = symbol>(
  initial: E.Env<E, A>,
  options?: KV.Options<K, A> | undefined,
) => KV.KV<K, E, A> & Ref<E & KV.Env<K>, A, A>
```

Added in v0.11.0

# Instance

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply3<'@typed/fp/Ref'>
```

Added in v0.11.0

## Functor

**Signature**

```ts
export declare const Functor: Functor3<'@typed/fp/Ref'>
```

Added in v0.11.0

## Profunctor

**Signature**

```ts
export declare const Profunctor: Profunctor3<'@typed/fp/Ref'>
```

Added in v0.11.0

## Provide

**Signature**

```ts
export declare const Provide: P.Provide3<'@typed/fp/Ref'>
```

Added in v0.11.0

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll3<'@typed/fp/Ref'>
```

Added in v0.11.0

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome3<'@typed/fp/Ref'>
```

Added in v0.11.0

## Semigroupoid

**Signature**

```ts
export declare const Semigroupoid: Semigroupoid3<'@typed/fp/Ref'>
```

Added in v0.11.0

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll3<'@typed/fp/Ref'>
```

Added in v0.11.0

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome3<'@typed/fp/Ref'>
```

Added in v0.11.0

# Instance Constructor

## getFromKV

**Signature**

```ts
export declare const getFromKV: <K>() => FKV.FromKV2<'@typed/fp/Ref', KV.Env<K>>
```

Added in v0.11.0

# Model

## Ref (interface)

**Signature**

```ts
export interface Ref<E, I, O = I> {
  readonly get: E.Env<E, O>
  readonly has: E.Env<E, boolean>
  readonly set: (input: I) => E.Env<E, O>
  readonly update: <E2>(f: (value: O) => E.Env<E2, I>) => E.Env<E & E2, O>
  readonly remove: E.Env<E, O.Option<O>>
  readonly values: RS.ReaderStream<E, O.Option<O>>
}
```

Added in v0.11.0

# Type-level

## InputOf (type alias)

**Signature**

```ts
export type InputOf<A> = [A] extends [Ref<any, infer R, any>] ? R : never
```

Added in v0.11.0

## OutputOf (type alias)

**Signature**

```ts
export type OutputOf<A> = [A] extends [Ref<any, any, infer R>] ? R : never
```

Added in v0.11.0

## RequirementsOf (type alias)

**Signature**

```ts
export type RequirementsOf<A> = [A] extends [Ref<infer R, any, any>] ? R : never
```

Added in v0.11.0

# Typeclass Constructor

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A, R, E>(S: Semigroup<A>) => Semigroup<Ref<R, E, A>>
```

Added in v0.11.0

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Ref'
```

Added in v0.11.0

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.11.0
