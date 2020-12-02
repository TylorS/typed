**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/set/hasValue"

# Module: "Shared/set/hasValue"

## Index

### Variables

* [hasValue](_shared_set_hasvalue_.md#hasvalue)

## Variables

### hasValue

• `Const` **hasValue**: \<K, V>(shared: [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V>, value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean>\<K, V>(shared: [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V>) => (value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean> = curry( \<K extends SharedKey, V>(shared: SharedSet\<K, V>, value: V): Effect\<SharedEnv, boolean> => // eslint-disable-next-line require-yield withShared(shared, function* (set) { return set.has(value) }),) as { \<K extends SharedKey, V>(shared: SharedSet\<K, V>, value: V): Effect\<SharedEnv, boolean> \<K extends SharedKey, V>(shared: SharedSet\<K, V>): (value: V) => Effect\<SharedEnv, boolean>}

*Defined in [src/Shared/set/hasValue.ts:10](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/set/hasValue.ts#L10)*

Check if a SharedSet has a given values
