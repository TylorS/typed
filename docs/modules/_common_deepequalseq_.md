**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/deepEqualsEq"

# Module: "common/deepEqualsEq"

## Index

### Functions

* [\_equals](_common_deepequalseq_.md#_equals)
* [\_uniqContentEquals](_common_deepequalseq_.md#_uniqcontentequals)
* [equals](_common_deepequalseq_.md#equals)

### Object literals

* [deepEqualsEq](_common_deepequalseq_.md#deepequalseq)

## Functions

### \_equals

▸ **_equals**(`a`: any, `b`: any, `stackA?`: any[], `stackB?`: any[]): boolean

*Defined in [src/common/deepEqualsEq.ts:18](https://github.com/TylorS/typed-fp/blob/8639976/src/common/deepEqualsEq.ts#L18)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`a` | any | - |
`b` | any | - |
`stackA` | any[] | [] |
`stackB` | any[] | [] |

**Returns:** boolean

___

### \_uniqContentEquals

▸ **_uniqContentEquals**(`aIterable`: Iterable\<any>, `bIterable`: Iterable\<any>, `stackA`: any[], `stackB`: any[]): boolean

*Defined in [src/common/deepEqualsEq.ts:141](https://github.com/TylorS/typed-fp/blob/8639976/src/common/deepEqualsEq.ts#L141)*

#### Parameters:

Name | Type |
------ | ------ |
`aIterable` | Iterable\<any> |
`bIterable` | Iterable\<any> |
`stackA` | any[] |
`stackB` | any[] |

**Returns:** boolean

___

### equals

▸ **equals**(`a`: any, `b`: any): boolean

*Defined in [src/common/deepEqualsEq.ts:14](https://github.com/TylorS/typed-fp/blob/8639976/src/common/deepEqualsEq.ts#L14)*

#### Parameters:

Name | Type |
------ | ------ |
`a` | any |
`b` | any |

**Returns:** boolean

## Object literals

### deepEqualsEq

▪ `Const` **deepEqualsEq**: object

*Defined in [src/common/deepEqualsEq.ts:12](https://github.com/TylorS/typed-fp/blob/8639976/src/common/deepEqualsEq.ts#L12)*

A deep-equality Eq instance.
Supports Reference equality, all JavaScript Primitives including `RegExp`, `Set` and `Map`.

**`eq`** 

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`equals` | [equals](_common_deepequalseq_.md#equals) | [equals](_common_deepequalseq_.md#equals) |
