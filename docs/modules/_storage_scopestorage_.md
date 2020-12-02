**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Storage/scopeStorage"

# Module: "Storage/scopeStorage"

## Index

### Functions

* [createScopedStorage](_storage_scopestorage_.md#createscopedstorage)
* [getAllKeysInScope](_storage_scopestorage_.md#getallkeysinscope)
* [scopeStorage](_storage_scopestorage_.md#scopestorage)

## Functions

### createScopedStorage

▸ **createScopedStorage**(`scope`: string, `storage`: Storage): Storage

*Defined in [src/Storage/scopeStorage.ts:10](https://github.com/TylorS/typed-fp/blob/559f273/src/Storage/scopeStorage.ts#L10)*

#### Parameters:

Name | Type |
------ | ------ |
`scope` | string |
`storage` | Storage |

**Returns:** Storage

___

### getAllKeysInScope

▸ **getAllKeysInScope**(`scope`: string, `storage`: Storage): string[]

*Defined in [src/Storage/scopeStorage.ts:52](https://github.com/TylorS/typed-fp/blob/559f273/src/Storage/scopeStorage.ts#L52)*

#### Parameters:

Name | Type |
------ | ------ |
`scope` | string |
`storage` | Storage |

**Returns:** string[]

___

### scopeStorage

▸ **scopeStorage**(`scope`: string, `storage`: Storage): Storage

*Defined in [src/Storage/scopeStorage.ts:6](https://github.com/TylorS/typed-fp/blob/559f273/src/Storage/scopeStorage.ts#L6)*

Create namespaces within a Storage implementation.

#### Parameters:

Name | Type |
------ | ------ |
`scope` | string |
`storage` | Storage |

**Returns:** Storage
