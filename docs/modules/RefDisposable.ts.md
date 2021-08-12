---
title: RefDisposable.ts
nav_order: 46
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
export declare const add: (disposable: Disposable) => E.Env<KV.Env<symbol>, Disposable>
```

Added in v0.11.0

## dispose

**Signature**

```ts
export declare const dispose: E.Env<KV.Env<symbol>, void>
```

Added in v0.11.0

## get

**Signature**

```ts
export declare const get: E.Env<KV.Env<symbol>, SettableDisposable>
```

Added in v0.11.0

## remove

**Signature**

```ts
export declare const remove: E.Env<KV.Env<symbol>, Option<SettableDisposable>>
```

Added in v0.11.0

# Ref

## RefDisposable

A Ref for tracking resources that can be disposed of.

**Signature**

```ts
export declare const RefDisposable: KV.KV<symbol, unknown, SettableDisposable> &
  Ref.Ref<KV.Env<symbol>, SettableDisposable, SettableDisposable>
```

Added in v0.11.0
