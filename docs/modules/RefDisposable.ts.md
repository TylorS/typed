---
title: RefDisposable.ts
nav_order: 48
parent: Modules
---

## RefDisposable overview

RefDisposable is a collection of helpers for working with Refs that manage resources.

Added in v0.11.0

---

<h2 class="text-delta">Table of contents</h2>

- [Effect](#effect)
  - [add](#add)
  - [dispose](#dispose)
  - [get](#get)
  - [remove](#remove)
- [Ref](#ref)
  - [RefDisposable](#refdisposable)

---

# Effect

## add

**Signature**

```ts
export declare const add: (disposable: Disposable) => E.Env<KV.Env, Disposable>
```

Added in v0.11.0

## dispose

**Signature**

```ts
export declare const dispose: E.Env<KV.Env, void>
```

Added in v0.11.0

## get

**Signature**

```ts
export declare const get: E.Env<KV.Env, SettableDisposable>
```

Added in v0.11.0

## remove

**Signature**

```ts
export declare const remove: E.Env<KV.Env, Option<SettableDisposable>>
```

Added in v0.11.0

# Ref

## RefDisposable

A Ref for tracking resources that can be disposed of.

**Signature**

```ts
export declare const RefDisposable: Ref.Ref<KV.Env, SettableDisposable, SettableDisposable> &
  KV.KV<symbol, unknown, SettableDisposable>
```

Added in v0.11.0
