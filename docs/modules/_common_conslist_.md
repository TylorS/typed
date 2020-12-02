**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/ConsList"

# Module: "common/ConsList"

## Index

### Type aliases

* [FlattenIntersection](_common_conslist_.md#flattenintersection)
* [FlattenUnion](_common_conslist_.md#flattenunion)
* [ToConsList](_common_conslist_.md#toconslist)
* [UnNest](_common_conslist_.md#unnest)

## Type aliases

### FlattenIntersection

Ƭ  **FlattenIntersection**\<A, S>: A *extends* [*infer* H] ? S & H : A *extends* [*infer* H, *infer* T] ? [FlattenIntersection\<T, S & H>] : S

*Defined in [src/common/ConsList.ts:22](https://github.com/TylorS/typed-fp/blob/6ccb290/src/common/ConsList.ts#L22)*

Lazily flatten a ConsList to an Intersection

#### Type parameters:

Name |
------ |
`A` |
`S` |

___

### FlattenUnion

Ƭ  **FlattenUnion**\<A, S>: A *extends* [*infer* H] ? S \| H : A *extends* [*infer* H, *infer* T] ? [FlattenUnion\<T, S \| H>] : S

*Defined in [src/common/ConsList.ts:31](https://github.com/TylorS/typed-fp/blob/6ccb290/src/common/ConsList.ts#L31)*

Lazily flatten a ConsList to a Union

#### Type parameters:

Name |
------ |
`A` |
`S` |

___

### ToConsList

Ƭ  **ToConsList**\<A>: [] *extends* A ? unknown : (...a: A) => any *extends* (t: *infer* T, ...ts: *infer* TS) => any ? [T, ToConsList\<TS>] : never

*Defined in [src/common/ConsList.ts:4](https://github.com/TylorS/typed-fp/blob/6ccb290/src/common/ConsList.ts#L4)*

Convert a list of values to a ConsList

#### Type parameters:

Name | Type |
------ | ------ |
`A` | readonly any[] |

___

### UnNest

Ƭ  **UnNest**\<T, Fallback>: T *extends* any[] ? {}[number] : Fallback

*Defined in [src/common/ConsList.ts:13](https://github.com/TylorS/typed-fp/blob/6ccb290/src/common/ConsList.ts#L13)*

Unnest a Flattened ConsList

#### Type parameters:

Name | Default |
------ | ------ |
`T` | - |
`Fallback` | unknown |
