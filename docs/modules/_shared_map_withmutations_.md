**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/withMutations"

# Module: "Shared/map/withMutations"

## Index

### Variables

* [withMutations](_shared_map_withmutations_.md#withmutations)

## Variables

### withMutations

• `Const` **withMutations**: \<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>, withMutable: (map: [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<K, V>) => void) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), ReadonlyMap\<K, V>>\<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>) => (withMutable: (map: [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<K, V>) => void) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), ReadonlyMap\<K, V>> = curry( \<SK extends SharedKey, K, V>( shared: SharedMap\<SK, K, V>, withMutable: (map: Map\<K, V>) => void, ): Effect\<SharedEnv, ReadonlyMap\<K, V>> => { const eff = doEffect(function* () { const map = yield* getShared(shared) const mutable = new Map(map) withMutable(mutable) if (!shared.eq.equals(map, mutable)) { return yield* setShared(shared, mutable) } return map }) return eff },) as { \<SK extends SharedKey, K, V>( shared: SharedMap\<SK, K, V>, withMutable: (map: Map\<K, V>) => void, ): Effect\<SharedEnv, ReadonlyMap\<K, V>> \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>): ( withMutable: (map: Map\<K, V>) => void, ) => Effect\<SharedEnv, ReadonlyMap\<K, V>>}

*Defined in [src/Shared/map/withMutations.ts:10](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/map/withMutations.ts#L10)*

Provide a mutable interface to a SharedMap
