**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Storage/KeyValueStorage"

# Module: "Storage/KeyValueStorage"

## Index

### Interfaces

* [KeyValueStorageEnv](../interfaces/_storage_keyvaluestorage_.keyvaluestorageenv.md)

### Type aliases

* [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)

### Variables

* [clearItems](_storage_keyvaluestorage_.md#clearitems)

### Functions

* [getItem](_storage_keyvaluestorage_.md#getitem)
* [removeItem](_storage_keyvaluestorage_.md#removeitem)
* [setItem](_storage_keyvaluestorage_.md#setitem)

## Type aliases

### KeyValueStorage

Ƭ  **KeyValueStorage**\<K, V>: { clearItems: () => [Resume](_resume_resume_.md#resume)\<Either\<Error, boolean>> ; getItem: (key: K) => [Resume](_resume_resume_.md#resume)\<Either\<Error, Option\<V>>> ; getItems: () => [Resume](_resume_resume_.md#resume)\<Either\<Error, ReadonlyArray\<V>>> ; getKeys: () => [Resume](_resume_resume_.md#resume)\<Either\<Error, ReadonlyArray\<K>>> ; removeItem: (key: K) => [Resume](_resume_resume_.md#resume)\<Either\<Error, Option\<V>>> ; setItem: (key: K, value: V) => [Resume](_resume_resume_.md#resume)\<Either\<Error, V>>  }

*Defined in [src/Storage/KeyValueStorage.ts:17](https://github.com/TylorS/typed-fp/blob/8639976/src/Storage/KeyValueStorage.ts#L17)*

Asynchronous localStorage-like API for key-value stores.

#### Type parameters:

Name |
------ |
`K` |
`V` |

#### Type declaration:

Name | Type |
------ | ------ |
`clearItems` | () => [Resume](_resume_resume_.md#resume)\<Either\<Error, boolean>> |
`getItem` | (key: K) => [Resume](_resume_resume_.md#resume)\<Either\<Error, Option\<V>>> |
`getItems` | () => [Resume](_resume_resume_.md#resume)\<Either\<Error, ReadonlyArray\<V>>> |
`getKeys` | () => [Resume](_resume_resume_.md#resume)\<Either\<Error, ReadonlyArray\<K>>> |
`removeItem` | (key: K) => [Resume](_resume_resume_.md#resume)\<Either\<Error, Option\<V>>> |
`setItem` | (key: K, value: V) => [Resume](_resume_resume_.md#resume)\<Either\<Error, V>> |

## Variables

### clearItems

• `Const` **clearItems**: [Effect](_effect_effect_.effect.md)\<[KeyValueStorageEnv](../interfaces/_storage_keyvaluestorage_.keyvaluestorageenv.md)\<unknown, unknown>, Either\<Error, boolean>> = fromEnv((e: KeyValueStorageEnv\<unknown, unknown>) => e.keyValueStorage.clearItems(),)

*Defined in [src/Storage/KeyValueStorage.ts:51](https://github.com/TylorS/typed-fp/blob/8639976/src/Storage/KeyValueStorage.ts#L51)*

Clear items from a KeyValueStorage.

## Functions

### getItem

▸ `Const`**getItem**\<K, V>(`key`: K): [Future](_future_exports_.md#future)\<[KeyValueStorageEnv](../interfaces/_storage_keyvaluestorage_.keyvaluestorageenv.md)\<K, V>, Error, Option\<V>>

*Defined in [src/Storage/KeyValueStorage.ts:29](https://github.com/TylorS/typed-fp/blob/8639976/src/Storage/KeyValueStorage.ts#L29)*

Get an Item.

#### Type parameters:

Name | Default |
------ | ------ |
`K` | - |
`V` | unknown |

#### Parameters:

Name | Type |
------ | ------ |
`key` | K |

**Returns:** [Future](_future_exports_.md#future)\<[KeyValueStorageEnv](../interfaces/_storage_keyvaluestorage_.keyvaluestorageenv.md)\<K, V>, Error, Option\<V>>

___

### removeItem

▸ `Const`**removeItem**\<K, V>(`key`: K): [Future](_future_exports_.md#future)\<[KeyValueStorageEnv](../interfaces/_storage_keyvaluestorage_.keyvaluestorageenv.md)\<K, V>, Error, Option\<V>>

*Defined in [src/Storage/KeyValueStorage.ts:43](https://github.com/TylorS/typed-fp/blob/8639976/src/Storage/KeyValueStorage.ts#L43)*

Remmove an item

#### Type parameters:

Name | Default |
------ | ------ |
`K` | - |
`V` | unknown |

#### Parameters:

Name | Type |
------ | ------ |
`key` | K |

**Returns:** [Future](_future_exports_.md#future)\<[KeyValueStorageEnv](../interfaces/_storage_keyvaluestorage_.keyvaluestorageenv.md)\<K, V>, Error, Option\<V>>

___

### setItem

▸ `Const`**setItem**\<K, V>(`key`: K, `value`: V): [Future](_future_exports_.md#future)\<[KeyValueStorageEnv](../interfaces/_storage_keyvaluestorage_.keyvaluestorageenv.md)\<K, V>, Error, V>

*Defined in [src/Storage/KeyValueStorage.ts:37](https://github.com/TylorS/typed-fp/blob/8639976/src/Storage/KeyValueStorage.ts#L37)*

Set an item

#### Type parameters:

Name |
------ |
`K` |
`V` |

#### Parameters:

Name | Type |
------ | ------ |
`key` | K |
`value` | V |

**Returns:** [Future](_future_exports_.md#future)\<[KeyValueStorageEnv](../interfaces/_storage_keyvaluestorage_.keyvaluestorageenv.md)\<K, V>, Error, V>
