**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/setKey"

# Module: "Shared/map/setKey"

## Index

### Variables

* [setKey](_shared_map_setkey_.md#setkey)

## Variables

### setKey

• `Const` **setKey**: \<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>, key: K, value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), V>\<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>, key: K) => (value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), V>\<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>) => (key: K, value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), V>(key: K) => (value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), V> = curry( \<SK extends SharedKey, K, V>( shared: SharedMap\<SK, K, V>, key: K, value: V, ): Effect\<SharedEnv, V> => doEffect(function* () { yield* withMutations(shared, (map) => map.set(key, value)) return value }),) as { \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>, key: K, value: V): Effect\<SharedEnv, V> \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>, key: K): ( value: V, ) => Effect\<SharedEnv, V> \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>): { (key: K, value: V): Effect\<SharedEnv, V> (key: K): (value: V) => Effect\<SharedEnv, V> }}

*Defined in [src/Shared/map/setKey.ts:12](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/map/setKey.ts#L12)*

Set the value of a key in a SharedMap
