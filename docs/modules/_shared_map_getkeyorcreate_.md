**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/getKeyOrCreate"

# Module: "Shared/map/getKeyOrCreate"

## Index

### Variables

* [getKeyOrCreate](_shared_map_getkeyorcreate_.md#getkeyorcreate)

## Variables

### getKeyOrCreate

• `Const` **getKeyOrCreate**: \<SK, K, V, E>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>, key: K, or: [Effect](_effect_effect_.effect.md)\<E, V>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E, V>\<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>, key: K) => \<E>(or: [Effect](_effect_effect_.effect.md)\<E, V>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E, V>\<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>) => \<E>(key: K, or: [Effect](_effect_effect_.effect.md)\<E, V>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E, V>(key: K) => \<E>(or: [Effect](_effect_effect_.effect.md)\<E, V>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E, V> = curry( \<SK extends SharedKey, K, V, E>( shared: SharedMap\<SK, K, V>, key: K, or: Effect\<E, V>, ): Effect\<SharedEnv & E, V> => { const eff = doEffect(function* () { const map = yield* getShared(shared) if (map.has(key)) { return map.get(key)! } return yield* setKey(shared, key, yield* or) }) return eff },) as { \<SK extends SharedKey, K, V, E>(shared: SharedMap\<SK, K, V>, key: K, or: Effect\<E, V>): Effect\< SharedEnv & E, V > \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>, key: K): \<E>( or: Effect\<E, V>, ) => Effect\<SharedEnv & E, V> \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>): { \<E>(key: K, or: Effect\<E, V>): Effect\<SharedEnv & E, V> (key: K): \<E>(or: Effect\<E, V>) => Effect\<SharedEnv & E, V> }}

*Defined in [src/Shared/map/getKeyOrCreate.ts:12](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/map/getKeyOrCreate.ts#L12)*

Get the value at a specific key or create it.
