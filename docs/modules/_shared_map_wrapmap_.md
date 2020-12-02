**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/wrapMap"

# Module: "Shared/map/wrapMap"

## Index

### Functions

* [wrapMap](_shared_map_wrapmap_.md#wrapmap)

## Functions

### wrapMap

▸ `Const`**wrapMap**\<SK, K, V>(`shared`: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>): object

*Defined in [src/Shared/map/wrapMap.ts:15](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/map/wrapMap.ts#L15)*

Wrap a SharedMap in useful operations.

#### Type parameters:

Name | Type |
------ | ------ |
`SK` | [SharedKey](_shared_core_model_sharedkey_.sharedkey.md) |
`K` | - |
`V` | - |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V> |

**Returns:** object

Name | Type |
------ | ------ |
`clear` | [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<ReadonlyMap\<K, V>>> |
`delete` | (key: K) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<V>> |
`get` | (key: K) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<V>> |
`getOrCreate` | \<E>(key: K, or: [Effect](_effect_effect_.effect.md)\<E, V>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E, V>(key: K) => \<E>(or: [Effect](_effect_effect_.effect.md)\<E, V>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E, V> |
`has` | (key: K) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean> |
`set` | (key: K, value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), V>(key: K) => (value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), V> |
`size` | [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), number> |
`withMutations` | (withMutable: (map: [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<K, V>) => void) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), ReadonlyMap\<K, V>> |
