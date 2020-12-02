**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/deleteKey"

# Module: "Shared/map/deleteKey"

## Index

### Variables

* [deleteKey](_shared_map_deletekey_.md#deletekey)

## Variables

### deleteKey

• `Const` **deleteKey**: \<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>, key: K) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<V>>\<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>) => (key: K) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<V>> = curry( \<SK extends SharedKey, K, V>( shared: SharedMap\<SK, K, V>, key: K, ): Effect\<SharedEnv, Option\<V>> => { const eff = doEffect(function* () { let value: Option\<V> = none yield* withMutations(shared, (map) => { if (map.has(key)) { value = some(map.get(key)!) } map.delete(key) }) return value }) return eff },) as { \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>, key: K): Effect\<SharedEnv, Option\<V>> \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>): ( key: K, ) => Effect\<SharedEnv, Option\<V>>}

*Defined in [src/Shared/map/deleteKey.ts:12](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/map/deleteKey.ts#L12)*

Delete a Value in a SharedMap
