**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/functionName"

# Module: "common/functionName"

## Index

### Variables

* [DEFAULT\_MATCH](_common_functionname_.md#default_match)
* [FUNCTION\_NAME\_REGEX](_common_functionname_.md#function_name_regex)

### Functions

* [functionName](_common_functionname_.md#functionname)

## Variables

### DEFAULT\_MATCH

• `Const` **DEFAULT\_MATCH**: string[] = ['', '']

*Defined in [src/common/functionName.ts:3](https://github.com/TylorS/typed-fp/blob/8639976/src/common/functionName.ts#L3)*

___

### FUNCTION\_NAME\_REGEX

• `Const` **FUNCTION\_NAME\_REGEX**: RegExp = /^function\s*([\w$]+)/

*Defined in [src/common/functionName.ts:1](https://github.com/TylorS/typed-fp/blob/8639976/src/common/functionName.ts#L1)*

## Functions

### functionName

▸ **functionName**(`fn`: Function): string

*Defined in [src/common/functionName.ts:12](https://github.com/TylorS/typed-fp/blob/8639976/src/common/functionName.ts#L12)*

Returns the name of a function.

**`example`** 
function foo() {...}

functionName(foo) === 'foo'

#### Parameters:

Name | Type |
------ | ------ |
`fn` | Function |

**Returns:** string
