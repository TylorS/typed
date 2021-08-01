---
title: use.ts
nav_order: 63
parent: Modules
---

## use overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Use](#use)
  - [bindEnvK](#bindenvk)
  - [useDisposable](#usedisposable)
  - [useEffect](#useeffect)
  - [useEnvK](#useenvk)
  - [useEq](#useeq)
  - [useKeyedRefs](#usekeyedrefs)
  - [useMemo](#usememo)
  - [useReaderStream](#usereaderstream)
  - [useRefs](#userefs)
  - [useRefsStream](#userefsstream)
  - [useStream](#usestream)
  - [useWithPrevious](#usewithprevious)

---

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
  E1 & E2 & E3 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
  { readonly [K in N | keyof A]: K extends keyof A ? A[K] : () => Disposable }
>
```

Added in v0.9.2

## useDisposable

**Signature**

```ts
export declare const useDisposable: <A = void>(
  Eq?: Eq<A>,
  switchLatest?: boolean,
) => (f: () => Disposable, value: A) => E.Env<Ref.Set & Ref.Get, Disposable>
```

Added in v0.9.2

## useEffect

**Signature**

```ts
export declare const useEffect: <A = void>(
  Eq?: Eq<A>,
  switchLatest?: boolean,
) => <E>(env: E.Env<E, any>, value: A) => E.Env<Ref.Set & Ref.Get & E & SchedulerEnv, Disposable>
```

Added in v0.9.2

## useEnvK

**Signature**

```ts
export declare function useEnvK<A extends ReadonlyArray<any>, E1, B, E2>(
  f: (...args: A) => E.Env<E1, B>,
  onValue: (value: B) => E.Env<E2, any> = E.of,
): E.Env<E1 & E2 & Ref.Refs, (...args: A) => Disposable>
```

Added in v0.9.2

## useEq

Use Refs to check if a value has changed between invocations

**Signature**

```ts
export declare const useEq: <A = void>(
  Eq?: Eq<A>,
  initial?: boolean,
) => (value: A) => E.Env<Ref.Set & Ref.Get, boolean>
```

Added in v0.9.2

## useKeyedRefs

**Signature**

```ts
export declare const useKeyedRefs: <A>(
  Eq: Eq<A>,
) => E.Env<
  Ref.Refs,
  {
    readonly findRefs: (value: A) => E.Env<unknown, Ref.Refs>
    readonly deleteRefs: (value: A) => S.Disposable
  }
>
```

Added in v0.9.2

## useMemo

**Signature**

```ts
export declare const useMemo: <E, A, B = void>(
  env: E.Env<E, A>,
  Eq?: Eq<B>,
) => (value: B) => E.Env<E & Ref.Get & Ref.Set, A>
```

Added in v0.9.2

## useReaderStream

**Signature**

```ts
export declare const useReaderStream: <A = void, B = unknown>(
  Eq?: Eq<A>,
  valueEq?: Eq<B>,
) => <E, C extends B>(
  rs: RS.ReaderStream<E, C>,
  dep: A,
) => E.Env<
  E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs & SchedulerEnv,
  O.Option<C>
>
```

Added in v0.9.2

## useRefs

**Signature**

```ts
export declare const useRefs: <A, E1, B>(
  f: (value: A) => E.Env<E1, B>,
  Eq: Eq<A>,
) => <E2>(
  stream: RS.ReaderStream<E2, readonly A[]>,
) => RS.ReaderStream<
  E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs & E2,
  readonly B[]
>
```

Added in v0.9.2

## useRefsStream

**Signature**

```ts
export declare const useRefsStream: <A, E1, B>(
  f: (value: A) => RS.ReaderStream<E1, B>,
  Eq: Eq<A>,
) => <E2>(
  stream: RS.ReaderStream<E2, readonly A[]>,
) => RS.ReaderStream<
  E1 & E2 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
  readonly B[]
>
```

Added in v0.9.2

## useStream

**Signature**

```ts
export declare const useStream: <A = void>(
  Eq?: Eq<A>,
) => <B>(
  stream: S.Stream<B>,
  dep: A,
) => E.Env<
  Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs & SchedulerEnv,
  O.Option<B>
>
```

Added in v0.9.2

## useWithPrevious

**Signature**

```ts
export declare const useWithPrevious: <A>() => <B>(
  f: (previous: O.Option<A>, value: A) => B,
  value: A,
) => E.Env<Ref.Set & Ref.Get, B>
```

Added in v0.9.2
