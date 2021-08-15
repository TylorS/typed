---
title: Context.ts
nav_order: 4
parent: Modules
---

## Context overview

Context is an alternative implementation of Ref which is capable of traversing up in a graph of to
find if any ancestors contain the given value. This is allows sharing values across otherwise
isolated environments.

Added in v0.11.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [useKV](#usekv)
- [Constructor](#constructor)
  - [fromKV](#fromkv)
- [utils](#utils)
  - [Context (interface)](#context-interface)

---

# Combinator

## useKV

Allows subscribing to the updates ensuring the current KV receives all updates from an Ancestor.

**Signature**

```ts
export declare function useKV<K, E, A>(kv: KV.KV<K, E, A>): E.Env<E & KV.Env & SchedulerEnv, A>
```

Added in v0.9.2

# Constructor

## fromKV

**Signature**

```ts
export declare const fromKV: <K, E, A>(
  kv: KV.KV<K, E, A>,
) => Context<E & KV.Env & SchedulerEnv, A, A> & KV.KV<K, E, A>
```

Added in v0.11.0

# utils

## Context (interface)

Context is an extensions of Ref which traverse up in context to find the closest environment which
contains the expected value.

**Signature**

```ts
export interface Context<E, I, O = I> extends Ref.Ref<E, I, O> {}
```

Added in v0.11.0
