**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/hasKey"

# Module: "Shared/map/hasKey"

## Index

### Variables

* [hasKey](_shared_map_haskey_.md#haskey)

## Variables

### hasKey

• `Const` **hasKey**: \<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>, key: K) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean>\<SK, K, V>(shared: [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)\<SK, K, V>) => (key: K) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean> = curry( \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>, key: K): Effect\<SharedEnv, boolean> => { const eff = doEffect(function* () { const map = yield* getShared(shared) return map.has(key) }) return eff },) as { \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>, key: K): Effect\<SharedEnv, boolean> \<SK extends SharedKey, K, V>(shared: SharedMap\<SK, K, V>): (key: K) => Effect\<SharedEnv, boolean>}

*Defined in [src/Shared/map/hasKey.ts:10](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/map/hasKey.ts#L10)*

Check if a Map has a specific value.
