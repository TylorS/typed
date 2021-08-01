---
title: Progress.ts
nav_order: 29
parent: Modules
---

## Progress overview

Progress is a data structure to represent loading some data.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor](#constructor)
  - [progress](#progress)
- [Instance](#instance)
  - [Eq](#eq)
  - [Semigroup](#semigroup)
  - [Show](#show)
- [Model](#model)
  - [Progress (interface)](#progress-interface)

---

# Constructor

## progress

**Signature**

```ts
export declare const progress: (loaded: number, total?: O.Option<number>) => Progress
```

Added in v0.9.2

# Instance

## Eq

**Signature**

```ts
export declare const Eq: E.Eq<Progress>
```

Added in v0.9.2

## Semigroup

**Signature**

```ts
export declare const Semigroup: S.Semigroup<Progress>
```

Added in v0.9.2

## Show

**Signature**

```ts
export declare const Show: Sh.Show<Progress>
```

Added in v0.9.2

# Model

## Progress (interface)

**Signature**

```ts
export interface Progress {
  readonly loaded: number
  readonly total: O.Option<number>
}
```

Added in v0.9.2
