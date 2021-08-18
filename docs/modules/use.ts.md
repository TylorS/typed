---
title: Use.ts
nav_order: 78
parent: Modules
---

## Use overview

Added in v0.11.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [useEq](#useeq)
  - [useEqWith](#useeqwith)
- [Constructor](#constructor)
  - [defaultOptionRef](#defaultoptionref)
- [Options](#options)
  - [UseDisposableWithOptions (type alias)](#usedisposablewithoptions-type-alias)
  - [UseMemoWithOptions (type alias)](#usememowithoptions-type-alias)
  - [UseReaderStreamWithOptions (type alias)](#usereaderstreamwithoptions-type-alias)
  - [UseStreamWithOptions (type alias)](#usestreamwithoptions-type-alias)
- [Use](#use)
  - [bindEnvK](#bindenvk)
  - [useDisposable](#usedisposable)
  - [useDisposableWith](#usedisposablewith)
  - [useEffectWith](#useeffectwith)
  - [useEnvK](#useenvk)
  - [useKVStream](#usekvstream)
  - [useKVs](#usekvs)
  - [useMemo](#usememo)
  - [useMemoWith](#usememowith)
  - [useReaderStream](#usereaderstream)
  - [useReaderStreamWith](#usereaderstreamwith)
  - [useStream](#usestream)
  - [useStreamWith](#usestreamwith)
  - [useWithPrevious](#usewithprevious)

---

# Combinator

## useEq

Use Refs to check if a value has changed between invocations

**Signature**

```ts
export declare const useEq: <A>(
  Eq?: Eq<A>,
  initial?: boolean,
) => (value: A) => E.Env<KV.Env, boolean>
```

Added in v0.11.0

## useEqWith

Use Refs to check if a value has changed between invocations

**Signature**

```ts
export declare function useEqWith<E, A = void>(ref: Ref.Ref<E, O.Option<A>>)
```

Added in v0.11.0

# Constructor

## defaultOptionRef

Use Refs to check if a value has changed between invocations

**Signature**

```ts
export declare const defaultOptionRef: <A>() => Ref.Ref<KV.Env, O.Option<A>, O.Option<A>> &
  KV.KV<symbol, unknown, O.Option<A>>
```

Added in v0.11.0

# Options

## UseDisposableWithOptions (type alias)

**Signature**

```ts
export type UseDisposableWithOptions<E1, E2, A> = {
  readonly disposable: Ref.Ref<E1, Disposable>
  readonly changed: Ref.Ref<E2, O.Option<A>>
}
```

Added in v0.11.0

## UseMemoWithOptions (type alias)

**Signature**

```ts
export type UseMemoWithOptions<E1, A, E2, B> = {
  readonly currentValue: Ref.Ref<E1, O.Option<A>>
  readonly changed: Ref.Ref<E2, O.Option<B>>
}
```

Added in v0.11.0

## UseReaderStreamWithOptions (type alias)

**Signature**

```ts
export type UseReaderStreamWithOptions<E1, A, E2, E3, B> = {
  readonly value: Ref.Ref<E1, O.Option<A>>
} & UseDisposableWithOptions<E2, E3, B>
```

Added in v0.11.0

## UseStreamWithOptions (type alias)

**Signature**

```ts
export type UseStreamWithOptions<E1, A, E2, E3, B> = UseReaderStreamWithOptions<E1, A, E2, E3, B>
```

Added in v0.11.0

# Use

## bindEnvK

**Signature**

```ts
export declare const bindEnvK: <N extends string, A, Args extends readonly any[], E1, B, E2>(
  name: Exclude<N, keyof A>,
  f: (...args: Args) => E.Env<E1, B>,
  onValue?: ((value: B) => E.Env<E2, any>) | undefined,
) => <E3>(
  ma: E.Env<E3, A>,
) => E.Env<
  E1 & E2 & E3 & KV.Env,
  { readonly [K in N | keyof A]: K extends keyof A ? A[K] : () => Disposable }
>
```

Added in v0.11.0

## useDisposable

**Signature**

```ts
export declare const useDisposable: <A>(
  Eq?: Eq<A>,
  switchLatest?: boolean,
) => (f: () => Disposable, value: A) => E.Env<KV.Env, Disposable>
```

Added in v0.11.0

## useDisposableWith

**Signature**

```ts
export declare const useDisposableWith: <E1, E2, A = void>(
  options: UseDisposableWithOptions<E1, E2, A>,
) => (
  Eq?: Eq<A>,
  switchLatest?: boolean,
) => (f: () => Disposable, value: A) => E.Env<E1 & E2 & KV.Env, Disposable>
```

Added in v0.11.0

## useEffectWith

**Signature**

```ts
export declare const useEffectWith: <E1, E2, A = void>(
  options: UseDisposableWithOptions<E1, E2, A>,
) => (
  Eq?: Eq<A>,
  switchLatest?: boolean,
) => <E>(env: E.Env<E, any>, value: A) => E.Env<E1 & E2 & KV.Env & E & SchedulerEnv, Disposable>
```

Added in v0.11.0

## useEnvK

Helps you to convert a Kliesli arrow of an Env into a function to a Disposable. Useful for UIs where
you need to provide onClick={fn} style handlers.

**Signature**

```ts
export declare function useEnvK<A extends ReadonlyArray<any>, E1, B, E2>(
  f: (...args: A) => E.Env<E1, B>,
  onValue: (value: B) => E.Env<E2, any> = E.of,
): E.Env<E1 & E2 & KV.Env, (...args: A) => Disposable>
```

Added in v0.11.0

## useKVStream

**Signature**

```ts
export declare const useKVStream: <A, E1, B>(
  f: (value: A) => RS.ReaderStream<E1, B>,
  Eq: Eq<A>,
) => <E2>(
  stream: RS.ReaderStream<E2, readonly A[]>,
) => RS.ReaderStream<E1 & E2 & KV.Env, readonly B[]>
```

Added in v0.11.0

## useKVs

**Signature**

```ts
export declare const useKVs: <A, E1, B>(
  f: (value: A) => E.Env<E1, B>,
  Eq: Eq<A>,
) => <E2>(
  stream: RS.ReaderStream<E2, readonly A[]>,
) => RS.ReaderStream<E1 & KV.Env & E2, readonly B[]>
```

Added in v0.11.0

## useMemo

**Signature**

```ts
export declare const useMemo: <E, A, B>(
  env: E.Env<E, A>,
  Eq?: Eq<B>,
) => (value: B) => E.Env<KV.Env & E, A>
```

Added in v0.11.0

## useMemoWith

**Signature**

```ts
export declare const useMemoWith: <E1, A, E2, B>(
  options: UseMemoWithOptions<E1, A, E2, B>,
) => <E3>(env: E.Env<E3, A>, Eq?: Eq<B>) => (value: B) => E.Env<E1 & E2 & E3, A>
```

Added in v0.11.0

## useReaderStream

**Signature**

```ts
export declare const useReaderStream: <A = void>(
  Eq?: Eq<A>,
) => <E4, C>(rs: RS.ReaderStream<E4, C>, dep: A) => E.Env<KV.Env & E4 & SchedulerEnv, O.Option<C>>
```

Added in v0.11.0

## useReaderStreamWith

**Signature**

```ts
export declare const useReaderStreamWith: <E1, A, E2, E3, B = void>(
  options: UseReaderStreamWithOptions<E1, A, E2, E3, B>,
) => (
  Eq?: Eq<B>,
) => <E4, C extends A>(
  rs: RS.ReaderStream<E4, C>,
  dep: B,
) => E.Env<E1 & E2 & E3 & E4 & SchedulerEnv & KV.Env, O.Option<C>>
```

Added in v0.11.0

## useStream

**Signature**

```ts
export declare const useStream: <A = void>(
  Eq?: Eq<A>,
) => <B>(stream: S.Stream<B>, dep: A) => E.Env<KV.Env & SchedulerEnv, O.Option<B>>
```

Added in v0.11.0

## useStreamWith

**Signature**

```ts
export declare const useStreamWith: <E1, A, E2, E3, B>(
  options: UseReaderStreamWithOptions<E1, A, E2, E3, B>,
) => (
  Eq?: Eq<B>,
) => (stream: S.Stream<A>, dep: B) => E.Env<E1 & E2 & E3 & SchedulerEnv & KV.Env, O.Option<A>>
```

Added in v0.11.0

## useWithPrevious

**Signature**

```ts
export declare const useWithPrevious: <E, A>(
  ref: Ref.Ref<E, O.Option<A>, O.Option<A>>,
) => <B>(f: (previous: O.Option<A>, value: A) => B, value: A) => E.Env<E, B>
```

Added in v0.11.0
