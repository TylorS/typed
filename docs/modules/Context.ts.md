---
title: Context.ts
nav_order: 3
parent: Modules
---

## Context overview

Context is built atop of @see Reference layering on the capability to traverse
up to ancestor environments to share state amongst multiple components.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [findProviderRefs](#findproviderrefs)
  - [get](#get)
  - [has](#has)
  - [listenTo](#listento)
  - [listenToValues](#listentovalues)
  - [remove](#remove)
  - [set](#set)
  - [toContext](#tocontext)
  - [update](#update)
  - [use](#use)
  - [withProviderRefs](#withproviderrefs)
  - [withProviderRefsStream](#withproviderrefsstream)
- [Constructor](#constructor)
  - [create](#create)
- [Model](#model)
  - [Context (interface)](#context-interface)

---

# Combinator

## findProviderRefs

Traverse up the tree of Refs and parent Refs to find the closest Refs that
has reference for a given Ref. This is useful for providing a React-like Context
API.

**Signature**

```ts
export declare const findProviderRefs: <E, A>(ref: Ref.Ref<E, A>) => E.Env<Ref.Refs, Ref.Refs>
```

Added in v0.9.2

## get

Traverse up the graph of Refs to find the closest ancestor containing
this ref to retrieve its value.

**Signature**

```ts
export declare function get<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs, A>
```

Added in v0.9.2

## has

Traverse up the graph of Refs to find if any ancestor is holding this value.

**Signature**

```ts
export declare function has<E, A>(ref: Ref.Ref<E, A>): E.Env<Ref.Refs, boolean>
```

Added in v0.9.2

## listenTo

Traverse up the graph of Refs to find if the closest ancestor holding this value to
listen to events regarding it's current state.

**Signature**

```ts
export declare function listenTo<E, A>(ref: Ref.Ref<E, A>): RS.ReaderStream<Ref.Refs, Ref.Event<E, A>>
```

Added in v0.9.2

## listenToValues

Traverse up the graph of Refs to find if the closest ancestor holding this value to
listen to the current value.

**Signature**

```ts
export declare function listenToValues<E, A>(ref: Ref.Ref<E, A>): RS.ReaderStream<E & Ref.Refs, O.Option<A>>
```

Added in v0.9.2

## remove

Traverse up the graph of Refs to find if the closest ancestor holding this value to
remove it.

**Signature**

```ts
export declare function remove<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs, O.Option<A>>
```

Added in v0.9.2

## set

Traverse up the graph of Refs to find if the closest ancestor holding this value to
set that value to something new.

**Signature**

```ts
export declare function set<E, A>(ref: Ref.Ref<E, A>)
```

Added in v0.9.2

## toContext

Construct a Context from a Ref.

**Signature**

```ts
export declare function toContext<E, A>(ref: Ref.Ref<E, A>): Context<E, A>
```

Added in v0.9.2

## update

Traverse up the graph of Refs to find if the closest ancestor holding this value to
update that value by applying an Env-based workflow.

**Signature**

```ts
export declare function update<E, A>(ref: Ref.Ref<E, A>)
```

Added in v0.9.2

## use

Allows subscribing to the updates ensuring the current Refs receives all
updates from an Ancestor.

**Signature**

```ts
export declare function use<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs & SchedulerEnv, A>
```

Added in v0.9.2

## withProviderRefs

**Signature**

```ts
export declare const withProviderRefs: <E, A>(
  ref: Ref.Ref<E, A>
) => <E2, B>(
  env: Ref.Env<E2, B>
) => E.Env<E2 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, B>
```

Added in v0.9.2

## withProviderRefsStream

**Signature**

```ts
export declare const withProviderRefsStream: <E, A>(
  ref: Ref.Ref<E, A>
) => <E2, B>(
  rs: Ref.ReaderStream<E2, B>
) => RS.ReaderStream<E2 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, B>
```

Added in v0.9.2

# Constructor

## create

Construct a Context

**Signature**

```ts
export declare const create: <E, A>(initial: E.Env<E, A>, options?: Ref.RefOptions<A> | undefined) => Context<E, A>
```

Added in v0.9.2

# Model

## Context (interface)

Context is an alternative implementation of Ref.Reference, which will traverse
up the tree of Refs until it finds the closest parent, or the current Refs, that contains
a value for the given Ref ID. If no parent Refs have any value the root-most Refs will be chosen
as the home.

**Signature**

```ts
export interface Context<E, A> extends Ref.Reference<E, A> {
  readonly use: E.Env<E & Ref.Refs & SchedulerEnv, A>
}
```

Added in v0.9.2
