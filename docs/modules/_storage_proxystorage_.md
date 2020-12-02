**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Storage/proxyStorage"

# Module: "Storage/proxyStorage"

## Index

### Functions

* [get](_storage_proxystorage_.md#get)
* [getByIndex](_storage_proxystorage_.md#getbyindex)
* [proxyStorage](_storage_proxystorage_.md#proxystorage)
* [set](_storage_proxystorage_.md#set)

## Functions

### get

▸ **get**(`target`: Storage, `property`: keyof Storage): any

*Defined in [src/Storage/proxyStorage.ts:9](https://github.com/TylorS/typed-fp/blob/f129829/src/Storage/proxyStorage.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`target` | Storage |
`property` | keyof Storage |

**Returns:** any

___

### getByIndex

▸ **getByIndex**(`index`: number, `storage`: Storage): null \| string

*Defined in [src/Storage/proxyStorage.ts:21](https://github.com/TylorS/typed-fp/blob/f129829/src/Storage/proxyStorage.ts#L21)*

#### Parameters:

Name | Type |
------ | ------ |
`index` | number |
`storage` | Storage |

**Returns:** null \| string

___

### proxyStorage

▸ **proxyStorage**(`storage`: Storage): Storage

*Defined in [src/Storage/proxyStorage.ts:5](https://github.com/TylorS/typed-fp/blob/f129829/src/Storage/proxyStorage.ts#L5)*

Proxy a Storage interface to allow indexing functionality around an otherwise
valid Storage interface.

#### Parameters:

Name | Type |
------ | ------ |
`storage` | Storage |

**Returns:** Storage

___

### set

▸ **set**(`target`: Storage, `property`: keyof Storage, `value`: string): boolean

*Defined in [src/Storage/proxyStorage.ts:27](https://github.com/TylorS/typed-fp/blob/f129829/src/Storage/proxyStorage.ts#L27)*

#### Parameters:

Name | Type |
------ | ------ |
`target` | Storage |
`property` | keyof Storage |
`value` | string |

**Returns:** boolean
