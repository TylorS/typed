---
title: Many.ts
nav_order: 13
parent: "@typed/context"
---

## Many overview

Create product types from products of Tags.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [TaggedStruct (interface)](#taggedstruct-interface)
  - [TaggedTuple (interface)](#taggedtuple-interface)
  - [struct](#struct)
  - [tuple](#tuple)

---

# utils

## TaggedStruct (interface)

A product type from a struct of Tags

**Signature**

```ts
export interface TaggedStruct<Tags extends StructOfTags>
  extends Tagged<C.Tag.Identifier<Tags[keyof Tags]>, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }>,
    Effect.Effect<C.Tag.Identifier<Tags[keyof Tags]>, never, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }> {
  readonly tags: Tags
}
```

Added in v1.0.0

## TaggedTuple (interface)

A product type from a tuple of Tags

**Signature**

```ts
export interface TaggedTuple<Tags extends TupleOfTags>
  extends Tagged<C.Tag.Identifier<Tags[number]>, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }>,
    Effect.Effect<C.Tag.Identifier<Tags[number]>, never, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }> {
  readonly tags: Tags
}
```

Added in v1.0.0

## struct

Create a TaggedStruct from a struct of Tags

**Signature**

```ts
export declare function struct<Tags extends StructOfTags>(tags: Tags): TaggedStruct<Tags>
```

Added in v1.0.0

## tuple

Create a TaggedTuple from a tuple of Tags

**Signature**

```ts
export declare function tuple<Tags extends TupleOfTags>(...tags: Tags): TaggedTuple<Tags>
```

Added in v1.0.0
