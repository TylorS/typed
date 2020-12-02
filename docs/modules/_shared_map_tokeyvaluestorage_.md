**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/toKeyValueStorage"

# Module: "Shared/map/toKeyValueStorage"

## Index

### Variables

* [KeyValueStorages](_shared_map_tokeyvaluestorage_.md#keyvaluestorages)

### Functions

* [toKeyValueStorage](_shared_map_tokeyvaluestorage_.md#tokeyvaluestorage)

## Variables

### KeyValueStorages

• `Const` **KeyValueStorages**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)\<any, any>>> = createShared( Symbol.for('KeyValueStorages'), Pure.fromIO(() => new Map\<SharedKey, KeyValueStorage\<any, any>>()),)

*Defined in [src/Shared/map/toKeyValueStorage.ts:13](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/map/toKeyValueStorage.ts#L13)*

## Functions

### toKeyValueStorage

▸ **toKeyValueStorage**\<SK, K, V>(`sm`: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)\<K, V>>

*Defined in [src/Shared/map/toKeyValueStorage.ts:21](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/map/toKeyValueStorage.ts#L21)*

Converts a SharedMap into KeyValueStorage

#### Type parameters:

Name | Type |
------ | ------ |
`SK` | [SharedKey](_shared_core_model_sharedkey_.sharedkey.md) |
`K` | - |
`V` | - |

#### Parameters:

Name | Type |
------ | ------ |
`sm` | [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [KeyValueStorage](_storage_keyvaluestorage_.md#keyvaluestorage)\<K, V>>
