**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/TupleFromUnion"

# Module: "common/TupleFromUnion"

## Index

### Type aliases

* [TupleFromUnion](_common_tuplefromunion_.md#tuplefromunion)

### Functions

* [ordFromUnion](_common_tuplefromunion_.md#ordfromunion)

## Type aliases

### TupleFromUnion

Ƭ  **TupleFromUnion**\<U, R>: {}[U]

*Defined in [src/common/TupleFromUnion.ts:14](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/common/TupleFromUnion.ts#L14)*

Converts a Union of keys into a union of Tuples representing all possible combinations.

**`example`** 
TupleFromUnion<1 | 2 | 3> === readonly [1, 2, 3]
 | readonly [1, 3, 2]
 | readonly [2, 1, 3]
 | readonly [2, 3, 1]
 | readonly [3, 1, 2]
 | readonly [3, 2, 1]

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`U` | PropertyKey | - |
`R` | readonly PropertyKey[] | [] |

## Functions

### ordFromUnion

▸ **ordFromUnion**\<U>(...`ordering`: [TupleFromUnion](_common_tuplefromunion_.md#tuplefromunion)\<U>): Ord\<U>

*Defined in [src/common/TupleFromUnion.ts:24](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/common/TupleFromUnion.ts#L24)*

Create an Ord instance from a union of string | number | symbol. This requires a valid
combination of all members of that union to construct an ordering for values of that union.

#### Type parameters:

Name | Type |
------ | ------ |
`U` | PropertyKey |

#### Parameters:

Name | Type |
------ | ------ |
`...ordering` | [TupleFromUnion](_common_tuplefromunion_.md#tuplefromunion)\<U> |

**Returns:** Ord\<U>
