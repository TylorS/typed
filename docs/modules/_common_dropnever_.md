**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/DropNever"

# Module: "common/DropNever"

## Index

### Type aliases

* [DropNever](_common_dropnever_.md#dropnever)
* [DropNeverKeys](_common_dropnever_.md#dropneverkeys)

## Type aliases

### DropNever

Ƭ  **DropNever**\<A>: {}

*Defined in [src/common/DropNever.ts:8](https://github.com/TylorS/typed-fp/blob/41076ce/src/common/DropNever.ts#L8)*

Remove all keys in an object that evaluate to `never`

**`example`** 
DropNever<{ a: 1, b: never }> == { a: 1 }

#### Type parameters:

Name |
------ |
`A` |

___

### DropNeverKeys

Ƭ  **DropNeverKeys**\<A>: {}[keyof A]

*Defined in [src/common/DropNever.ts:15](https://github.com/TylorS/typed-fp/blob/41076ce/src/common/DropNever.ts#L15)*

Get all of the keys in an object that do not evaluate to `never`.

**`example`** 
DropNeverKeys<{ a: 1, b: 2, c: never }> == 'a' | 'b'

#### Type parameters:

Name |
------ |
`A` |
