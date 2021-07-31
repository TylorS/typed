---
title: Ref.ts
nav_order: 34
parent: Modules
---

## Ref overview

`Ref` is an abstraction for managing state-based applications using [Env](./Env.ts.md). It exposes
an extensible get/set/delete API for managing keys to values. Every `Ref` is connected to an `Env`
that will provide the default value lazily when first asked for or after being deleted previously.

The provided implementation will also send events containing all of the creations/updates/deletes
occurring in real-time.

Here's a small example of a Counter application to show how one might use Ref to create a simple
counter application.

```ts
import * as E from '@typed/fp/Env'
import * as RS from '@typed/fp/ReaderStream'
import * as Ref from '@typed/fp/Ref'
import * as S from '@typed/fp/Stream'
import * as U from '@typed/fp/use'
import { newDefaultScheduler } from '@most/scheduler'
import * as F from 'fp-ts/function'
import { html, render, Renderable } from 'uhtml'

const rootElement: HTMLElement | null = document.getElementById('app')

if (!rootElement) {
  throw new Error('Unable to find element by #app')
}

// Creates a Reference to keep our Count
// It requires no resources and tracks a number
const Count: Ref.Reference<unknown, number> = Ref.create(E.of(0))

// Actions to update our Count Reference - easily tested
const increment: E.Env<Ref.Refs, number> = Count.update(F.flow(F.increment, E.of))

const decrement: E.Env<Ref.Refs, number> = Count.update(
  F.flow(
    F.decrement,
    E.of,
    E.map((x) => Math.max(0, x)),
  ),
)

// Creates a component which represents our counter
const Counter: E.Env<Ref.Refs, Renderable> = F.pipe(
  E.Do,
  U.bindEnvK('dec', () => decrement),
  U.bindEnvK('inc', () => increment),
  E.bindW('count', () => Count.get),
  E.map(
    ({ dec, inc, count }) => html`<div>
      <button onclick=${dec}>Decrement</button>
      <span>Count: ${count}</span>
      <button onclick=${inc}>Increment</button>
    </div>`,
  ),
)

const Main: RS.ReaderStream<Ref.Refs, HTMLElement> = F.pipe(
  Counter,
  Ref.sample, // Sample our Counter everytime there is a Ref update.
  RS.scan(render, rootElement), // Render our application using 'uhtml'
)

// Provide Main with its required resources
const stream: S.Stream<HTMLElement> = Main(Ref.refs())

// Execute our Stream with a default scheduler
S.runEffects(stream, newDefaultScheduler()).catch((error) => console.error(error))
```

It is likely worth noting that, by default, `Ref.make` is not referentially transparent. It will
automatically generate a unique `Symbol()` on each invocation for the `Ref.id`. If you need
referential transparency, be sure to provide your own `id`. This also applies to `Ref.create` and
the `Context.create`.

```ts
const myRef = Ref.make(initial, {
  id: 'MyId',
})
```

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [get](#get)
  - [getAdapter](#getadapter)
  - [getParentRefs](#getparentrefs)
  - [getRefEvents](#getrefevents)
  - [getRefs](#getrefs)
  - [getSendEvent](#getsendevent)
  - [has](#has)
  - [listenTo](#listento)
  - [listenToValues](#listentovalues)
  - [provideAll](#provideall)
  - [provideSome](#providesome)
  - [remove](#remove)
  - [sample](#sample)
  - [sendEvent](#sendevent)
  - [set](#set)
  - [update](#update)
  - [useAll](#useall)
  - [useSome](#usesome)
- [Constructor](#constructor)
  - [create](#create)
  - [make](#make)
  - [toReference](#toreference)
- [Deconstructor](#deconstructor)
  - [match](#match)
  - [matchW](#matchw)
- [Environment](#environment)
  - [Events (interface)](#events-interface)
  - [Get (interface)](#get-interface)
  - [Has (interface)](#has-interface)
  - [ParentRefs (interface)](#parentrefs-interface)
  - [Refs (type alias)](#refs-type-alias)
  - [Remove (interface)](#remove-interface)
  - [Set (interface)](#set-interface)
- [Environment Constructor](#environment-constructor)
  - [refs](#refs)
- [Instance](#instance)
  - [Provide](#provide)
  - [ProvideAll](#provideall)
  - [ProvideSome](#providesome)
  - [UseAll](#useall)
  - [UseSome](#usesome)
- [Model](#model)
  - [Adapter (type alias)](#adapter-type-alias)
  - [Created (interface)](#created-interface)
  - [Event (type alias)](#event-type-alias)
  - [Of (interface)](#of-interface)
  - [Ref (interface)](#ref-interface)
  - [Reference (interface)](#reference-interface)
  - [Removed (interface)](#removed-interface)
  - [Updated (interface)](#updated-interface)
- [Options](#options)
  - [RefOptions (type alias)](#refoptions-type-alias)
  - [RefsOptions (type alias)](#refsoptions-type-alias)
- [Refinement](#refinement)
  - [isCreated](#iscreated)
  - [isRemoved](#isremoved)
  - [isUpdated](#isupdated)
- [Type-level](#type-level)
  - [Env (type alias)](#env-type-alias)
  - [EnvOf (type alias)](#envof-type-alias)
  - [ReaderStream (type alias)](#readerstream-type-alias)
  - [ValueOf (type alias)](#valueof-type-alias)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## get

**Signature**

```ts
export declare const get: <E, A>(ref: Ref<E, A>) => E.Env<E & Get, A>
```

Added in v0.9.2

## getAdapter

**Signature**

```ts
export declare const getAdapter: E.Env<
  Events,
  readonly [(event: Event<any, any>) => void, Stream<Event<any, any>>]
>
```

Added in v0.9.2

## getParentRefs

**Signature**

```ts
export declare const getParentRefs: E.Env<ParentRefs, O.Option<Refs>>
```

Added in v0.9.2

## getRefEvents

**Signature**

```ts
export declare const getRefEvents: RS.ReaderStream<Events, Event<any, any>>
```

Added in v0.9.2

## getRefs

**Signature**

```ts
export declare const getRefs: E.Env<Refs, Refs>
```

Added in v0.9.2

## getSendEvent

**Signature**

```ts
export declare const getSendEvent: E.Env<Events, (event: Event<any, any>) => void>
```

Added in v0.9.2

## has

**Signature**

```ts
export declare const has: <E, A>(ref: Ref<E, A>) => E.Env<Has, boolean>
```

Added in v0.9.2

## listenTo

**Signature**

```ts
export declare const listenTo: <E, A>(ref: Ref<E, A>) => RS.ReaderStream<Events, Event<E, A>>
```

Added in v0.9.2

## listenToValues

**Signature**

```ts
export declare const listenToValues: <E, A>(
  ref: Ref<E, A>,
) => RS.ReaderStream<E & Events, O.Option<A>>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <E>(
  provided: E,
) => <A>(ref: Reference<E, A>) => Reference<unknown, A>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <E1>(
  provided: E1,
) => <E2, A>(ref: Reference<E1 & E2, A>) => Reference<E2, A>
```

Added in v0.9.2

## remove

**Signature**

```ts
export declare const remove: <E, A>(ref: Ref<E, A>) => E.Env<E & Remove, O.Option<A>>
```

Added in v0.9.2

## sample

Sample an Env with the latest references when updates have occured.

**Signature**

```ts
export declare const sample: <E, A>(
  env: Env<E, A>,
) => RS.ReaderStream<E & Get & Has & Set & Remove & Events & ParentRefs, A>
```

Added in v0.9.2

## sendEvent

**Signature**

```ts
export declare const sendEvent: <E, A>(event: Event<E, A>) => E.Env<Events, void>
```

Added in v0.9.2

## set

**Signature**

```ts
export declare const set: <E, A>(ref: Ref<E, A>) => (value: A) => E.Env<E & Set, A>
```

Added in v0.9.2

## update

**Signature**

```ts
export declare const update: <E1, A>(
  ref: Ref<E1, A>,
) => <E2>(f: (value: A) => E.Env<E2, A>) => E.Env<E1 & Set & E2 & Get, A>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <E1>(
  provided: E1,
) => <A>(ref: Reference<E1, A>) => Reference<unknown, A>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <E1>(
  provided: E1,
) => <E2, A>(ref: Reference<E1 & E2, A>) => Reference<E2, A>
```

Added in v0.9.2

# Constructor

## create

**Signature**

```ts
export declare const create: <E, A>(
  initial: E.Env<E, A>,
  options?: RefOptions<A> | undefined,
) => Reference<E, A>
```

Added in v0.9.2

## make

**Signature**

```ts
export declare function make<E, A>(initial: E.Env<E, A>, options: RefOptions<A> = {}): Ref<E, A>
```

Added in v0.9.2

## toReference

**Signature**

```ts
export declare function toReference<E, A>(ref: Ref<E, A>): Reference<E, A>
```

Added in v0.9.2

# Deconstructor

## match

**Signature**

```ts
export declare const match: <A, B, C>(
  onCreated: (value: A, ref: Ref<B, A>) => C,
  onUpdated: (previousValue: A, value: A, ref: Ref<B, A>) => C,
  onDeleted: (ref: Ref<B, A>) => C,
) => (event: Event<B, A>) => C
```

Added in v0.9.2

## matchW

**Signature**

```ts
export declare const matchW: <A, B, C, D, E>(
  onCreated: (value: A, ref: Ref<B, A>) => C,
  onUpdated: (previousValue: A, value: A, ref: Ref<B, A>) => D,
  onDeleted: (ref: Ref<B, A>) => E,
) => (event: Event<B, A>) => C | D | E
```

Added in v0.9.2

# Environment

## Events (interface)

**Signature**

```ts
export interface Events {
  readonly refEvents: Adapter
}
```

Added in v0.9.2

## Get (interface)

**Signature**

```ts
export interface Get {
  readonly getRef: <E, A>(ref: Ref<E, A>) => E.Env<E, A>
}
```

Added in v0.9.2

## Has (interface)

**Signature**

```ts
export interface Has {
  readonly hasRef: <E, A>(ref: Ref<E, A>) => E.Of<boolean>
}
```

Added in v0.9.2

## ParentRefs (interface)

**Signature**

```ts
export interface ParentRefs {
  readonly parentRefs: O.Option<Refs>
}
```

Added in v0.9.2

## Refs (type alias)

**Signature**

```ts
export type Refs = Get & Has & Set & Remove & Events & ParentRefs
```

Added in v0.9.2

## Remove (interface)

**Signature**

```ts
export interface Remove {
  readonly removeRef: <E, A>(ref: Ref<E, A>) => E.Env<E, O.Option<A>>
}
```

Added in v0.9.2

## Set (interface)

**Signature**

```ts
export interface Set {
  readonly setRef: <E, A>(ref: Ref<E, A>, value: A) => E.Env<E, A>
}
```

Added in v0.9.2

# Environment Constructor

## refs

**Signature**

```ts
export declare function refs(options: RefsOptions = {}): Refs
```

Added in v0.9.2

# Instance

## Provide

**Signature**

```ts
export declare const Provide: P.Provide2<'@typed/fp/Ref'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll2<'@typed/fp/Ref'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome2<'@typed/fp/Ref'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll2<'@typed/fp/Ref'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome2<'@typed/fp/Ref'>
```

Added in v0.9.2

# Model

## Adapter (type alias)

**Signature**

```ts
export type Adapter = A.Adapter<Event<any, any>>
```

Added in v0.9.2

## Created (interface)

**Signature**

```ts
export interface Created<E, A> {
  readonly _tag: 'Created'
  readonly ref: Ref<E, A>
  readonly value: A
  readonly refs: O.Option<Refs>
}
```

Added in v0.9.2

## Event (type alias)

**Signature**

```ts
export type Event<E, A> = Created<E, A> | Updated<E, A> | Removed<E, A>
```

Added in v0.9.2

## Of (interface)

**Signature**

```ts
export interface Of<A> extends Ref<unknown, A> {}
```

Added in v0.9.2

## Ref (interface)

**Signature**

```ts
export interface Ref<E, A> extends Eq<A> {
  readonly id: PropertyKey
  readonly initial: E.Env<E, A>
}
```

Added in v0.9.2

## Reference (interface)

**Signature**

```ts
export interface Reference<E, A> extends Ref<E, A> {
  readonly get: E.Env<E & Refs, A>
  readonly has: E.Env<Refs, boolean>
  readonly set: (value: A) => E.Env<E & Refs, A>
  readonly update: <E2>(f: (value: A) => E.Env<E2, A>) => E.Env<E & E2 & Refs, A>
  readonly remove: E.Env<E & Refs, O.Option<A>>
  readonly listen: RS.ReaderStream<Refs, Event<E, A>>
  readonly values: RS.ReaderStream<E & Refs, O.Option<A>>
}
```

Added in v0.9.2

## Removed (interface)

**Signature**

```ts
export interface Removed<E, A> {
  readonly _tag: 'Removed'
  readonly ref: Ref<E, A>
  readonly refs: O.Option<Refs>
}
```

Added in v0.9.2

## Updated (interface)

**Signature**

```ts
export interface Updated<E, A> {
  readonly _tag: 'Updated'
  readonly ref: Ref<E, A>
  readonly previousValue: A
  readonly value: A
  readonly refs: O.Option<Refs>
}
```

Added in v0.9.2

# Options

## RefOptions (type alias)

**Signature**

```ts
export type RefOptions<A> = {
  readonly eq?: Eq<A>
  readonly id?: PropertyKey
}
```

Added in v0.9.2

## RefsOptions (type alias)

**Signature**

```ts
export type RefsOptions = {
  readonly initial?: Iterable<readonly [any, any]>
  readonly refEvents?: Adapter
  readonly parentRefs?: Refs
}
```

Added in v0.9.2

# Refinement

## isCreated

**Signature**

```ts
export declare const isCreated: <E, A>(event: Event<E, A>) => event is Created<E, A>
```

Added in v0.9.2

## isRemoved

**Signature**

```ts
export declare const isRemoved: <E, A>(event: Event<E, A>) => event is Removed<E, A>
```

Added in v0.9.2

## isUpdated

**Signature**

```ts
export declare const isUpdated: <E, A>(event: Event<E, A>) => event is Updated<E, A>
```

Added in v0.9.2

# Type-level

## Env (type alias)

Creates a union of Envs for all the possible combinations for Ref environments.

**Signature**

```ts
export type Env<E, A> =
  | E.Env<E, A>
  | GetEnv<CombinationsOf<E, [Get, Has, Set, Remove, Events, ParentRefs]>, A>
```

Added in v0.9.2

## EnvOf (type alias)

**Signature**

```ts
export type EnvOf<A> = [A] extends [Ref<infer R, any>] ? R : never
```

Added in v0.9.2

## ReaderStream (type alias)

Creates a union of ReaderStreams for all the possible combinations for Ref environments.

**Signature**

```ts
export type ReaderStream<E, A> =
  | RS.ReaderStream<E, A>
  | GetReaderStream<CombinationsOf<E, [Get, Has, Set, Remove, Events, ParentRefs]>, A>
```

Added in v0.9.2

## ValueOf (type alias)

**Signature**

```ts
export type ValueOf<A> = [A] extends [Ref<any, infer R>] ? R : never
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Ref'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
