**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Storage/indexedDb/idbRequestToResume"

# Module: "Storage/indexedDb/idbRequestToResume"

## Index

### Interfaces

* [IDBRequestEnv](../interfaces/_storage_indexeddb_idbrequesttoresume_.idbrequestenv.md)

### Functions

* [idbRequestToResume](_storage_indexeddb_idbrequesttoresume_.md#idbrequesttoresume)

## Functions

### idbRequestToResume

▸ **idbRequestToResume**\<A>(`tx`: [IndexedDbStoreTransation](../interfaces/_storage_indexeddb_indexeddbstoretransaction_.indexeddbstoretransation.md), `f`: (store: IDBObjectStore) => IDBRequest\<A>): [Async](../interfaces/_resume_async_.async.md)\<Either\<Error, A>>

*Defined in [src/Storage/indexedDb/idbRequestToResume.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/Storage/indexedDb/idbRequestToResume.ts#L14)*

Convert an indexed db request to a Resume

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`tx` | [IndexedDbStoreTransation](../interfaces/_storage_indexeddb_indexeddbstoretransaction_.indexeddbstoretransation.md) |
`f` | (store: IDBObjectStore) => IDBRequest\<A> |

**Returns:** [Async](../interfaces/_resume_async_.async.md)\<Either\<Error, A>>
