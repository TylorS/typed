**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Storage/dom"

# Module: "Storage/dom"

## Index

### Functions

* [tryCatch](_storage_dom_.md#trycatch)
* [wrapDomStorage](_storage_dom_.md#wrapdomstorage)

## Functions

### tryCatch

▸ `Const`**tryCatch**\<A, B>(`f`: (...args: A) => [Resume](_resume_resume_.md#resume)\<B>): function

*Defined in [src/Storage/dom.ts:58](https://github.com/TylorS/typed-fp/blob/41076ce/src/Storage/dom.ts#L58)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | readonly any[] |
`B` | - |

#### Parameters:

Name | Type |
------ | ------ |
`f` | (...args: A) => [Resume](_resume_resume_.md#resume)\<B> |

**Returns:** function

___

### wrapDomStorage

▸ **wrapDomStorage**(`storage`: Storage): [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)\<string, string>

*Defined in [src/Storage/dom.ts:11](https://github.com/TylorS/typed-fp/blob/41076ce/src/Storage/dom.ts#L11)*

Wrap session/localStorage into a KeyValueStorage implementation.

#### Parameters:

Name | Type |
------ | ------ |
`storage` | Storage |

**Returns:** [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)\<string, string>
