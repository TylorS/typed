**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/set/deleteValue"

# Module: "Shared/set/deleteValue"

## Index

### Variables

* [deleteValue](_shared_set_deletevalue_.md#deletevalue)

## Variables

### deleteValue

• `Const` **deleteValue**: \<K, V>(shared: [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V>, value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean>\<K, V>(shared: [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V>) => (value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean> = curry( \<K extends SharedKey, V>(shared: SharedSet\<K, V>, value: V): Effect\<SharedEnv, boolean> => { const eff = doEffect(function* () { let deleted = false yield* withMutations(shared, (set) => (deleted = set.delete(value))) return deleted }) return eff },) as { \<K extends SharedKey, V>(shared: SharedSet\<K, V>, value: V): Effect\<SharedEnv, boolean> \<K extends SharedKey, V>(shared: SharedSet\<K, V>): (value: V) => Effect\<SharedEnv, boolean>}

*Defined in [src/Shared/set/deleteValue.ts:12](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/set/deleteValue.ts#L12)*

Delete a value from a SharedSet
