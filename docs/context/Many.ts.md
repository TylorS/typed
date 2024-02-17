---
title: Many.ts
nav_order: 12
parent: "@typed/context"
---

## Many overview

Create product types from products of Tags.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [struct](#struct)
  - [tuple](#tuple)
- [models](#models)
  - [TaggedStruct (interface)](#taggedstruct-interface)
  - [TaggedTuple (interface)](#taggedtuple-interface)

---

# constructors

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

# models

## TaggedStruct (interface)

A product type from a struct of Tags

**Signature**

```ts
export interface TaggedStruct<Tags extends StructOfTags>
  extends Actions<C.Tag.Identifier<Tags[keyof Tags]>, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }>,
    Provision<C.Tag.Identifier<Tags[keyof Tags]>, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }>,
    Effect.Effect<{ readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }, never, C.Tag.Identifier<Tags[keyof Tags]>> {
  readonly tags: Tags
}
```

Added in v1.0.0

## TaggedTuple (interface)

A product type from a tuple of Tags

**Signature**

```ts
export interface TaggedTuple<Tags extends TupleOfTags>
  extends Actions<C.Tag.Identifier<Tags[number]>, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }>,
    Provision<C.Tag.Identifier<Tags[number]>, { readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }>,
    Effect.Effect<{ readonly [K in keyof Tags]: C.Tag.Service<Tags[K]> }, never, C.Tag.Identifier<Tags[number]>> {
  readonly tags: Tags
}
```

Added in v1.0.0
