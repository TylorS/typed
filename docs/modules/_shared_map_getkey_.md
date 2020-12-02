**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/getKey"

# Module: "Shared/map/getKey"

## Index

### Variables

* [getKey](_shared_map_getkey_.md#getkey)

## Variables

### getKey

• `Const` **getKey**: \<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>, key: K) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<V>>\<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>) => (key: K) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<V>> = curry( \<SK extends SharedKey, K, V>( shared: SharedMap\<SK, K, V>, key: K, ): Effect\<SharedEnv, Option\<V>> => { const eff = doEffect(function* () { const map = yield* getShared(shared) if (map.has(key)) { return some(map.get(key)!) } return none }) return eff },) as { \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>, key: K): Effect\<SharedEnv, Option\<V>> \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>): ( key: K, ) => Effect\<SharedEnv, Option\<V>>}

*Defined in [src/Shared/map/getKey.ts:11](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/map/getKey.ts#L11)*

Get a value from a specific key of a SharedMap
