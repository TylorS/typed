**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/set/addValue"

# Module: "Shared/set/addValue"

## Index

### Variables

* [addValue](_shared_set_addvalue_.md#addvalue)

## Variables

### addValue

• `Const` **addValue**: \<K, V>(shared: [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V>, value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), ReadonlySet\<V>>\<K, V>(shared: [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V>) => (value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), ReadonlySet\<V>> = curry( \<K extends SharedKey, V>(shared: SharedSet\<K, V>, value: V): Effect\<SharedEnv, ReadonlySet\<V>> => withMutations(shared, (set) => set.add(value)),) as { \<K extends SharedKey, V>(shared: SharedSet\<K, V>, value: V): Effect\<SharedEnv, ReadonlySet\<V>> \<K extends SharedKey, V>(shared: SharedSet\<K, V>): (value: V) => Effect\<SharedEnv, ReadonlySet\<V>>}

*Defined in [src/Shared/set/addValue.ts:11](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/set/addValue.ts#L11)*

Add a value to a SharedSet
