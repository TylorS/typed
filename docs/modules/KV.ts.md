---
title: KV.ts
nav_order: 33
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
  - [getParentEnv](#getparentenv)
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
  - [ParentEnv (interface)](#parentenv-interface)
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
export declare const findKVProvider: <K, E, A>(ref: KV<K, E, A>) => E.Env<Env, Env>
```

Added in v0.11.0

## get

**Signature**

```ts
export declare const get: <K, E, A>(kv: KV<K, E, A>) => E.Env<E & Get, A>
```

Added in v0.11.0

## getAdapter

**Signature**

```ts
export declare const getAdapter: E.Env<
  Events,
  readonly [(event: Event<any, any>) => void, Stream<Event<any, any>>]
>
```

Added in v0.12.0

## getEnv

**Signature**

```ts
export declare const getEnv: E.Env<Env, Env>
```

Added in v0.12.0

## getKVEvents

**Signature**

```ts
export declare const getKVEvents: RS.ReaderStream<Events, Event<any, any>>
```

Added in v0.12.0

## getParentEnv

**Signature**

```ts
export declare const getParentEnv: E.Env<ParentEnv, O.Option<Env>>
```

Added in v0.11.0

## getSendEvent

**Signature**

```ts
export declare const getSendEvent: E.Env<Events, (event: Event<any, any>) => void>
```

Added in v0.11.0

## has

**Signature**

```ts
export declare const has: <K, E, A>(kv: KV<K, E, A>) => E.Env<Has, boolean>
```

Added in v0.11.0

## listenTo

**Signature**

```ts
export declare const listenTo: <K, E, A>(kv: KV<K, E, A>) => RS.ReaderStream<Events, Event<K, A>>
```

Added in v0.11.0

## listenToValues

**Signature**

```ts
export declare const listenToValues: <K, E, A>(
  kv: KV<K, E, A>,
) => RS.ReaderStream<E & Events, O.Option<A>>
```

Added in v0.11.0

## remove

**Signature**

```ts
export declare const remove: <K, E, A>(kv: KV<K, E, A>) => E.Env<E & Remove, O.Option<A>>
```

Added in v0.11.0

## sample

Sample an Env with the latest references when updates have occured.

**Signature**

```ts
export declare const sample: <E, A>(env: E.Env<E, A>) => RS.ReaderStream<E & Env, A>
```

Added in v0.11.0

## sendEvent

**Signature**

```ts
export declare const sendEvent: <K, A>(event: Event<K, A>) => E.Env<Events, void>
```

Added in v0.11.0

## set

**Signature**

```ts
export declare const set: <K, E, A>(kv: KV<K, E, A>) => (value: A) => E.Env<E & Set, A>
```

Added in v0.11.0

## update

**Signature**

```ts
export declare const update: <K, E1, A>(
  kv: KV<K, E1, A>,
) => <E2>(f: (value: A) => E.Env<E2, A>) => E.Env<E1 & Set & E2 & Get, A>
```

Added in v0.11.0

## withProvider

**Signature**

```ts
export declare const withProvider: <K, E, A>(
  kv: KV<K, E, A>,
) => <E2, B>(env: E.Env<E2, B>) => E.Env<E2 & Env, B>
```

Added in v0.11.0

## withProviderStream

**Signature**

```ts
export declare const withProviderStream: <K, E, A>(
  kv: KV<K, E, A>,
) => <E2, B>(rs: RS.ReaderStream<E2, B>) => RS.ReaderStream<E2 & Env, B>
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
export declare const match: <A, K, B>(
  onCreated: (value: A, key: K) => B,
  onUpdated: (previousValue: A, value: A, key: K) => B,
  onDeleted: (key: K) => B,
) => (event: Event<K, A>) => B
```

Added in v0.12.0

## matchW

**Signature**

```ts
export declare const matchW: <A, K, B, C, D>(
  onCreated: (value: A, key: K) => B,
  onUpdated: (previousValue: A, value: A, key: K) => C,
  onDeleted: (key: K) => D,
) => (event: Event<K, A>) => B | C | D
```

Added in v0.12.0

# Environment

## Env (interface)

**Signature**

```ts
export interface Env extends Get, Has, Set, Remove, Events, ParentEnv {}
```

Added in v0.12.0

## Events (interface)

**Signature**

```ts
export interface Events {
  readonly kvEvents: Adapter
}
```

Added in v0.12.0

## Get (interface)

**Signature**

```ts
export interface Get {
  readonly getKV: <K, E, A>(kv: KV<K, E, A>) => E.Env<E, A>
}
```

Added in v0.12.0

## Has (interface)

**Signature**

```ts
export interface Has {
  readonly hasKV: <K, E, A>(kv: KV<K, E, A>) => E.Of<boolean>
}
```

Added in v0.12.0

## ParentEnv (interface)

**Signature**

```ts
export interface ParentEnv {
  readonly parentKVEnv: O.Option<Env>
}
```

Added in v0.12.0

## Remove (interface)

**Signature**

```ts
export interface Remove {
  readonly removeKV: <K, E, A>(kv: KV<K, E, A>) => E.Env<E, O.Option<A>>
}
```

Added in v0.12.0

## Set (interface)

**Signature**

```ts
export interface Set {
  readonly setKV: <K, E, A>(kv: KV<K, E, A>, value: A) => E.Env<E, A>
}
```

Added in v0.12.0

# Environment Constructor

## env

**Signature**

```ts
export declare function env(options: EnvOptions = {}): Env
```

Added in v0.12.0

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
export type Adapter = A.Adapter<Event<any, any>>
```

Added in v0.11.0

## Created (interface)

**Signature**

```ts
export interface Created<K, A> {
  readonly _tag: 'Created'
  readonly key: K
  readonly value: A
  readonly fromAncestor: boolean
}
```

Added in v0.12.0

## Event (type alias)

**Signature**

```ts
export type Event<K, A> = Created<K, A> | Updated<K, A> | Removed<K>
```

Added in v0.12.0

## KV (interface)

**Signature**

```ts
export interface KV<K, E, A> extends Eq<A> {
  readonly key: K
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
export interface Removed<K> {
  readonly _tag: 'Removed'
  readonly key: K
  readonly fromAncestor: boolean
}
```

Added in v0.12.0

## Updated (interface)

**Signature**

```ts
export interface Updated<K, A> {
  readonly _tag: 'Updated'
  readonly key: K
  readonly previousValue: A
  readonly value: A
  readonly fromAncestor: boolean
}
```

Added in v0.12.0

# Options

## EnvOptions (type alias)

**Signature**

```ts
export type EnvOptions = {
  readonly initial?: Iterable<readonly [any, any]>
  readonly kvEvents?: Adapter
  readonly parentEnv?: Env
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
export declare const isCreated: <K, A>(event: Event<K, A>) => event is Created<K, A>
```

Added in v0.11.0

## isRemoved

**Signature**

```ts
export declare const isRemoved: <K, A>(event: Event<K, A>) => event is Removed<K>
```

Added in v0.11.0

## isUpdated

**Signature**

```ts
export declare const isUpdated: <K, A>(event: Event<K, A>) => event is Updated<K, A>
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
export declare const useKeyedEnvs: <A>(
  Eq: Eq<A>,
) => E.Env<
  Env,
  { readonly findRefs: (key: A) => E.Env<Get, Env>; readonly deleteRefs: (key: A) => D.Disposable }
>
```

Added in v0.11.0
