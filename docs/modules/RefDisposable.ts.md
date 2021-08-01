---
title: RefDisposable.ts
nav_order: 43
parent: Modules
---

## RefDisposable overview

RefDisposable is an abstraction over [Ref](./Ref.ts.md) to keep track of all resources created
within the context of a particular instance of Refs.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [add](#add)
  - [dispose](#dispose)
  - [get](#get)

---

# Combinator

## add

**Signature**

```ts
export declare const add: (disposable: Disposable) => E.Env<Ref.Get, Disposable>
```

Added in v0.9.2

## dispose

**Signature**

```ts
export declare const dispose: E.Env<Ref.Remove & Ref.Get, void>
```

Added in v0.9.2

## get

**Signature**

```ts
export declare const get: E.Env<Ref.Get, SettableDisposable>
```

Added in v0.9.2
