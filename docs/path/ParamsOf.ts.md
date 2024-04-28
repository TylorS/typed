---
title: ParamsOf.ts
nav_order: 4
parent: "@typed/path"
---

## ParamsOf overview

Type-level parameter extraction of the path-to-regexp syntax

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [HasParams (type alias)](#hasparams-type-alias)
  - [ParamsList (type alias)](#paramslist-type-alias)
  - [ParamsOf (type alias)](#paramsof-type-alias)

---

# utils

## HasParams (type alias)

**Signature**

```ts
export type HasParams<T extends string> =
  A.Equals<T, string> extends 1
    ? false
    : [ParamsOf<T>] extends [infer R]
      ? [keyof R] extends [never]
        ? false
        : true
      : false
```

Added in v1.0.0

## ParamsList (type alias)

ParamsList

**Signature**

```ts
export type ParamsList<T extends string> =
  A.Equals<T, string> extends 1
    ? [params?: {}]
    : [ParamsOf<T>] extends [infer R]
      ? [keyof R] extends [never]
        ? [params?: {}]
        : [params: R]
      : [params?: {}]
```

Added in v1.0.0

## ParamsOf (type alias)

Extract the parameters from a path

**Signature**

```ts
export type ParamsOf<T extends string> = A.Equals<T, string> extends 1 ? {} : ToParams<ParseSegments<PathToSegments<T>>>
```

Added in v1.0.0
