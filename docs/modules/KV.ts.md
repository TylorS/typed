---
title: KV.ts
nav_order: 28
parent: Modules
---

## KV overview

`KV` is an abstraction for managing state-based applications using [Env](./Env.ts.md). It exposes an
extensible get/set/delete API for managing keys to values. Every `KV` is connected to an `Env` that
will provide the default value lazily when first asked for or after being deleted previously.

The provided implementation will also send events containing all of the creations/updates/deletes
occurring in real-time.

Added in v0.11.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [findKVProvider](#findkvprovider)
  - [get](#get)
  - [getAdapter](#getadapter)
  - [getEnv](#getenv)
  - [getKVEvents](#getkvevents)
  - [getParentKVs](#getparentkvs)
  - [getSendEvent](#getsendevent)
  - [has](#has)
  - [listenTo](#listento)
  - [listenToValues](#listentovalues)
  - [remove](#remove)
  - [sample](#sample)
  - [sendEvent](#sendevent)
  - [set](#set)
  - [update](#update)
  - [withProvider](#withprovider)
  - [withProviderStream](#withproviderstream)
- [Constructor](#constructor)
  - [make](#make)
- [Deconstructor](#deconstructor)
  - [match](#match)
  - [matchW](#matchw)
- [Environment](#environment)
  - [Env (interface)](#env-interface)
  - [Events (interface)](#events-interface)
  - [Get (interface)](#get-interface)
  - [Has (interface)](#has-interface)
  - [ParentKVEnv (interface)](#parentkvenv-interface)
  - [Remove (interface)](#remove-interface)
  - [Set (interface)](#set-interface)
- [Environment Constructor](#environment-constructor)
  - [env](#env)
- [KV](#kv)
  - [Disposable](#disposable)
- [Model](#model)
  - [Adapter (type alias)](#adapter-type-alias)
  - [Created (interface)](#created-interface)
  - [Event (type alias)](#event-type-alias)
  - [KV (interface)](#kv-interface)
  - [Of (interface)](#of-interface)
  - [Removed (interface)](#removed-interface)
  - [Updated (interface)](#updated-interface)
- [Options](#options)
  - [EnvOptions (type alias)](#envoptions-type-alias)
  - [Options (type alias)](#options-type-alias)
- [Refinement](#refinement)
  - [isCreated](#iscreated)
  - [isRemoved](#isremoved)
  - [isUpdated](#isupdated)
- [Type-level](#type-level)
  - [EnvOf (type alias)](#envof-type-alias)
  - [KeyOf (type alias)](#keyof-type-alias)
  - [ValueOf (type alias)](#valueof-type-alias)
- [Use](#use)
  - [useKeyedEnvs](#usekeyedenvs)

---

# Combinator

## findKVProvider

Traverse up the tree of KVEnv and parent KVEnv to find the closest KVEnv that has reference for a
given KV. This is useful for providing a React-like Context API atop of KV.

**Signature**

```ts
export declare const findKVProvider: <K, E, A>(ref: KV<K, E, A>) => E.Env<Env<K>, Env<K>>
```

Added in v0.11.0

## get

**Signature**

```ts
export declare const get: <K, E, A>(kv: KV<K, E, A>) => E.Env<E & Get<K>, A>
```

Added in v0.11.0

## getAdapter

**Signature**

```ts
export declare const getAdapter: <K = any>() => E.Env<
  Events<K>,
  readonly [(event: Event<K, any, any>) => void, Stream<Event<K, any, any>>]
>
```

Added in v0.11.0

## getEnv

**Signature**

```ts
export declare const getEnv: <K>() => E.Env<Env<K>, Env<K>>
```

Added in v0.11.0

## getKVEvents

**Signature**

```ts
export declare const getKVEvents: <K>() => RS.ReaderStream<Events<K>, Event<K, any, any>>
```

Added in v0.11.0

## getParentKVs

**Signature**

```ts
export declare const getParentKVs: <K>() => E.Env<ParentKVEnv<K>, O.Option<Env<K>>>
```

Added in v0.11.0

## getSendEvent

**Signature**

```ts
export declare const getSendEvent: <K = any>() => E.Env<
  Events<K>,
  (event: Event<K, any, any>) => void
>
```

Added in v0.11.0

## has

**Signature**

```ts
export declare const has: <K, E, A>(kv: KV<K, E, A>) => E.Env<Has<K>, boolean>
```

Added in v0.11.0

## listenTo

**Signature**

```ts
export declare const listenTo: <K, E, A>(
  kv: KV<K, E, A>,
) => RS.ReaderStream<Events<K>, Event<K, E, A>>
```

Added in v0.11.0

## listenToValues

**Signature**

```ts
export declare const listenToValues: <K, E, A>(
  kv: KV<K, E, A>,
) => RS.ReaderStream<E & Events<K>, O.Option<A>>
```

Added in v0.11.0

## remove

**Signature**

```ts
export declare const remove: <K, E, A>(kv: KV<K, E, A>) => E.Env<E & Remove<K>, O.Option<A>>
```

Added in v0.11.0

## sample

Sample an Env with the latest references when updates have occured.

**Signature**

```ts
export declare const sample: <E, A>(env: E.Env<E, A>) => RS.ReaderStream<E & Env<any>, A>
```

Added in v0.11.0

## sendEvent

**Signature**

```ts
export declare const sendEvent: <K, E, A>(event: Event<K, E, A>) => E.Env<Events<K>, void>
```

Added in v0.11.0

## set

**Signature**

```ts
export declare const set: <K, E, A>(kv: KV<K, E, A>) => (value: A) => E.Env<E & Set<K>, A>
```

Added in v0.11.0

## update

**Signature**

```ts
export declare const update: <K, E1, A>(
  kv: KV<K, E1, A>,
) => <E2>(f: (value: A) => E.Env<E2, A>) => E.Env<E1 & Set<K> & E2 & Get<K>, A>
```

Added in v0.11.0

## withProvider

**Signature**

```ts
export declare const withProvider: <K, E, A>(
  kv: KV<K, E, A>,
) => <E2, B>(env: E.Env<E2, B>) => E.Env<E2 & Env<K>, B>
```

Added in v0.11.0

## withProviderStream

**Signature**

```ts
export declare const withProviderStream: <K, E, A>(
  kv: KV<K, E, A>,
) => <E2, B>(rs: RS.ReaderStream<E2, B>) => RS.ReaderStream<E2 & Env<K>, B>
```

Added in v0.11.0

# Constructor

## make

Note that by default an incrementing index is utilized to generate a key if one is not provided. In
other words, by default, this is not referentially transparent for your own convenience

**Signature**

```ts
export declare function make<E, A, K = symbol>(
  initial: E.Env<E, A>,
  options: Options<K, A> = {},
): KV<K, E, A>
```

Added in v0.11.0

# Deconstructor

## match

**Signature**

```ts
export declare const match: <A, K, B, C>(
  onCreated: (value: A, kv: KV<K, B, A>) => C,
  onUpdated: (previousValue: A, value: A, kv: KV<K, B, A>) => C,
  onDeleted: (kv: KV<K, B, A>) => C,
) => (event: Event<K, B, A>) => C
```

Added in v0.11.0

## matchW

**Signature**

```ts
export declare const matchW: <A, K, B, C, D, E>(
  onCreated: (value: A, kv: KV<K, B, A>) => C,
  onUpdated: (previousValue: A, value: A, kv: KV<K, B, A>) => D,
  onDeleted: (kv: KV<K, B, A>) => E,
) => (event: Event<K, B, A>) => C | D | E
```

Added in v0.11.0

# Environment

## Env (interface)

**Signature**

```ts
export interface Env<K> extends Get<K>, Has<K>, Set<K>, Remove<K>, Events<K>, ParentKVEnv<K> {}
```

Added in v0.11.0

## Events (interface)

**Signature**

```ts
export interface Events<K> {
  readonly kvEvents: Adapter<K>
}
```

Added in v0.11.0

## Get (interface)

**Signature**

```ts
export interface Get<K> {
  readonly getKV: <E, A>(kv: KV<K, E, A>) => E.Env<E, A>
}
```

Added in v0.11.0

## Has (interface)

**Signature**

```ts
export interface Has<K> {
  readonly hasKV: <E, A>(kv: KV<K, E, A>) => E.Of<boolean>
}
```

Added in v0.11.0

## ParentKVEnv (interface)

**Signature**

```ts
export interface ParentKVEnv<K> {
  readonly parentKVEnv: O.Option<Env<K>>
}
```

Added in v0.11.0

## Remove (interface)

**Signature**

```ts
export interface Remove<K> {
  readonly removeKV: <E, A>(kv: KV<K, E, A>) => E.Env<E, O.Option<A>>
}
```

Added in v0.11.0

## Set (interface)

**Signature**

```ts
export interface Set<K> {
  readonly setKV: <E, A>(kv: KV<K, E, A>, value: A) => E.Env<E, A>
}
```

Added in v0.11.0

# Environment Constructor

## env

**Signature**

```ts
export declare function env<K>(options: EnvOptions<K> = {}): Env<K>
```

Added in v0.11.0

# KV

## Disposable

A shared KV for keeping track of a context's disposable resources.

**Signature**

```ts
export declare const Disposable: KV<symbol, unknown, D.SettableDisposable>
```

Added in v0.11.0

# Model

## Adapter (type alias)

**Signature**

```ts
export type Adapter<K> = A.Adapter<Event<K, any, any>>
```

Added in v0.11.0

## Created (interface)

**Signature**

```ts
export interface Created<K, E, A> {
  readonly _tag: 'Created'
  readonly kv: KV<K, E, A>
  readonly value: A
  readonly env: O.Option<Env<K>>
}
```

Added in v0.11.0

## Event (type alias)

**Signature**

```ts
export type Event<K, E, A> = Created<K, E, A> | Updated<K, E, A> | Removed<K, E, A>
```

Added in v0.11.0

## KV (interface)

**Signature**

```ts
export interface KV<K, E, A> extends Eq<A> {
  readonly key: K // Use function to ensure this is a covariant property
  readonly initial: E.Env<E, A>
}
```

Added in v0.11.0

## Of (interface)

**Signature**

```ts
export interface Of<K, A> extends KV<K, unknown, A> {}
```

Added in v0.11.0

## Removed (interface)

**Signature**

```ts
export interface Removed<K, E, A> {
  readonly _tag: 'Removed'
  readonly kv: KV<K, E, A>
  readonly env: O.Option<Env<K>>
}
```

Added in v0.11.0

## Updated (interface)

**Signature**

```ts
export interface Updated<K, E, A> {
  readonly _tag: 'Updated'
  readonly kv: KV<K, E, A>
  readonly previousValue: A
  readonly value: A
  readonly env: O.Option<Env<K>>
}
```

Added in v0.11.0

# Options

## EnvOptions (type alias)

**Signature**

```ts
export type EnvOptions<K> = {
  readonly initial?: Iterable<readonly [K, any]>
  readonly kvEvents?: Adapter<K>
  readonly parentKVEnv?: Env<K>
}
```

Added in v0.11.0

## Options (type alias)

**Signature**

```ts
export type Options<K, A> = {
  readonly key?: K
} & Partial<Eq<A>>
```

Added in v0.11.0

# Refinement

## isCreated

**Signature**

```ts
export declare const isCreated: <K, E, A>(event: Event<K, E, A>) => event is Created<K, E, A>
```

Added in v0.11.0

## isRemoved

**Signature**

```ts
export declare const isRemoved: <K, E, A>(event: Event<K, E, A>) => event is Removed<K, E, A>
```

Added in v0.11.0

## isUpdated

**Signature**

```ts
export declare const isUpdated: <K, E, A>(event: Event<K, E, A>) => event is Updated<K, E, A>
```

Added in v0.11.0

# Type-level

## EnvOf (type alias)

**Signature**

```ts
export type EnvOf<A> = [A] extends [KV<any, infer R, any>] ? R : never
```

Added in v0.11.0

## KeyOf (type alias)

**Signature**

```ts
export type KeyOf<A> = [A] extends [KV<infer R, any, any>] ? R : never
```

Added in v0.11.0

## ValueOf (type alias)

**Signature**

```ts
export type ValueOf<A> = [A] extends [KV<any, any, infer R>] ? R : never
```

Added in v0.11.0

# Use

## useKeyedEnvs

**Signature**

```ts
export declare const useKeyedEnvs: <A>(Eq: Eq<A>) => E.Env<
  Env<any>,
  {
    readonly findRefs: (value: A) => E.Env<Get<symbol>, Env<any>>
    readonly deleteRefs: (value: A) => D.Disposable
  }
>
```

Added in v0.11.0
