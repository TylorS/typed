---
title: Meta.ts
nav_order: 11
parent: "@typed/template"
---

## Meta overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [MANY_HOLE](#many_hole)
  - [TEXT_START](#text_start)
  - [TYPED_END](#typed_end)
  - [TYPED_HASH](#typed_hash)
  - [TYPED_HOLE](#typed_hole)
  - [TYPED_START](#typed_start)

---

# utils

## MANY_HOLE

Used to mark separation between the start and end of a template.

**Signature**

```ts
export declare const MANY_HOLE: (key: PropertyKey) => string
```

Added in v1.0.0

## TEXT_START

**Signature**

```ts
export declare const TEXT_START: "<!--text-->"
```

Added in v1.0.0

## TYPED_END

**Signature**

```ts
export declare const TYPED_END: "<!--typed-end-->"
```

Added in v1.0.0

## TYPED_HASH

**Signature**

```ts
export declare const TYPED_HASH: (hash: string) => string
```

Added in v1.0.0

## TYPED_HOLE

**Signature**

```ts
export declare const TYPED_HOLE: (index: number) => string
```

Added in v1.0.0

## TYPED_START

**Signature**

```ts
export declare const TYPED_START: "<!--typed-start-->"
```

Added in v1.0.0
