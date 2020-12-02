**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/includesWith"

# Module: "common/includesWith"

## Index

### Functions

* [includesWith](_common_includeswith_.md#includeswith)

## Functions

### includesWith

▸ **includesWith**\<A, B>(`pred`: (value: A, item: B, index: number) => boolean, `x`: A, `list`: B[]): boolean

*Defined in [src/common/includesWith.ts:5](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/common/includesWith.ts#L5)*

Checks to see if a list contains a value passing an additional
value to the predicate.

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`pred` | (value: A, item: B, index: number) => boolean |
`x` | A |
`list` | B[] |

**Returns:** boolean
