**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Storage/indexedDb/createIndexedDb"

# Module: "Storage/indexedDb/createIndexedDb"

## Index

### Type aliases

* [IndexedDBFailure](_storage_indexeddb_createindexeddb_.md#indexeddbfailure)

### Variables

* [IndexedDBFailure](_storage_indexeddb_createindexeddb_.md#indexeddbfailure)

### Functions

* [chainResumeEither](_storage_indexeddb_createindexeddb_.md#chainresumeeither)
* [createIndexedDbKeyValueStorage](_storage_indexeddb_createindexeddb_.md#createindexeddbkeyvaluestorage)
* [createKeyValueStorageFromDatabase](_storage_indexeddb_createindexeddb_.md#createkeyvaluestoragefromdatabase)
* [mapResumeEither](_storage_indexeddb_createindexeddb_.md#mapresumeeither)

## Type aliases

### IndexedDBFailure

Ƭ  **IndexedDBFailure**: [FailEnv](_effect_failures_.md#failenv)\<*typeof* [IndexedDBFailure](_storage_indexeddb_createindexeddb_.md#indexeddbfailure), Error>

*Defined in [src/Storage/indexedDb/createIndexedDb.ts:15](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Storage/indexedDb/createIndexedDb.ts#L15)*

## Variables

### IndexedDBFailure

• `Const` **IndexedDBFailure**: \"@typed/fp/Storage/IndexedDbFailure\" = "@typed/fp/Storage/IndexedDbFailure"

*Defined in [src/Storage/indexedDb/createIndexedDb.ts:14](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Storage/indexedDb/createIndexedDb.ts#L14)*

## Functions

### chainResumeEither

▸ `Const`**chainResumeEither**\<A, B, C>(`r`: [Resume](_resume_resume_.md#resume)\<Either\<A, B>>, `f`: (b: B) => [Resume](_resume_resume_.md#resume)\<Either\<A, C>>): [Resume](_resume_resume_.md#resume)\<Either\<A, C>>

*Defined in [src/Storage/indexedDb/createIndexedDb.ts:73](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Storage/indexedDb/createIndexedDb.ts#L73)*

#### Type parameters:

Name |
------ |
`A` |
`B` |
`C` |

#### Parameters:

Name | Type |
------ | ------ |
`r` | [Resume](_resume_resume_.md#resume)\<Either\<A, B>> |
`f` | (b: B) => [Resume](_resume_resume_.md#resume)\<Either\<A, C>> |

**Returns:** [Resume](_resume_resume_.md#resume)\<Either\<A, C>>

___

### createIndexedDbKeyValueStorage

▸ **createIndexedDbKeyValueStorage**\<K, V>(`name`: string): [Effect](_effect_effect_.effect.md)\<[IndexedDbFactoryEnv](../interfaces/_storage_indexeddb_indexeddbfactoryenv_.indexeddbfactoryenv.md) & [IndexedDBFailure](_storage_indexeddb_createindexeddb_.md#indexeddbfailure), [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)\<K, V>>

*Defined in [src/Storage/indexedDb/createIndexedDb.ts:20](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Storage/indexedDb/createIndexedDb.ts#L20)*

Create a KeyValueStorage implementation using indexed-db

#### Type parameters:

Name | Type |
------ | ------ |
`K` | IDBValidKey |
`V` | - |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** [Effect](_effect_effect_.effect.md)\<[IndexedDbFactoryEnv](../interfaces/_storage_indexeddb_indexeddbfactoryenv_.indexeddbfactoryenv.md) & [IndexedDBFailure](_storage_indexeddb_createindexeddb_.md#indexeddbfailure), [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)\<K, V>>

___

### createKeyValueStorageFromDatabase

▸ **createKeyValueStorageFromDatabase**\<K, V>(`database`: IDBDatabase): [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)\<K, V>

*Defined in [src/Storage/indexedDb/createIndexedDb.ts:32](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Storage/indexedDb/createIndexedDb.ts#L32)*

#### Type parameters:

Name | Type |
------ | ------ |
`K` | IDBValidKey |
`V` | - |

#### Parameters:

Name | Type |
------ | ------ |
`database` | IDBDatabase |

**Returns:** [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)\<K, V>

___

### mapResumeEither

▸ `Const`**mapResumeEither**\<A, B, C>(`r`: [Resume](_resume_resume_.md#resume)\<Either\<A, B>>, `f`: (b: B) => C): [Resume](_resume_resume_.md#resume)\<Either\<A, C>>

*Defined in [src/Storage/indexedDb/createIndexedDb.ts:70](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Storage/indexedDb/createIndexedDb.ts#L70)*

#### Type parameters:

Name |
------ |
`A` |
`B` |
`C` |

#### Parameters:

Name | Type |
------ | ------ |
`r` | [Resume](_resume_resume_.md#resume)\<Either\<A, B>> |
`f` | (b: B) => C |

**Returns:** [Resume](_resume_resume_.md#resume)\<Either\<A, C>>
