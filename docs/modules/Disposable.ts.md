---
title: Disposable.ts
nav_order: 8
parent: Modules
---

## Disposable overview

Disposable is an interface for representing resources which can be synchronously disposed of.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [undisposable](#undisposable)
- [Constructor](#constructor)
  - [settable](#settable)
- [Model](#model)
  - [SettableDisposable (interface)](#settabledisposable-interface)

---

# Combinator

## undisposable

Wrap a non-Disposable function into a Disposable-returning function

**Signature**

```ts
export declare const undisposable: <F extends FunctionN<readonly any[], any>>(
  fn: F,
) => (...args: ArgsOf<F>) => Disposable
```

Added in v0.9.2

# Constructor

## settable

Construct a SettableDisposable

**Signature**

```ts
export declare function settable(): SettableDisposable
```

Added in v0.9.2

# Model

## SettableDisposable (interface)

A Disposable that works in a more imperative manner. Can be useful when coercing external libraries
or using promises.

**Signature**

```ts
export interface SettableDisposable extends Disposable {
  readonly addDisposable: (disposable: Disposable) => Disposable
  readonly isDisposed: () => boolean
}
```

Added in v0.9.2
