**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/set/withMutations"

# Module: "Shared/set/withMutations"

## Index

### Variables

* [withMutations](_shared_set_withmutations_.md#withmutations)

## Variables

### withMutations

• `Const` **withMutations**: \<K, V>(shared: [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V>, f: (set: Set\<V>) => void) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), ReadonlySet\<V>>\<K, V>(shared: [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V>) => (f: (set: Set\<V>) => void) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), ReadonlySet\<V>> = curry( \<K extends SharedKey, V>( shared: SharedSet\<K, V>, f: (set: Set\<V>) => void, ): Effect\<SharedEnv, ReadonlySet\<V>> => { return withShared(shared, function* (set) { const mutable = new Set(set) f(mutable) if (!shared.eq.equals(set, mutable)) { return yield* setShared(shared, mutable) } return set }) },) as { \<K extends SharedKey, V>(shared: SharedSet\<K, V>, f: (set: Set\<V>) => void): Effect\< SharedEnv, ReadonlySet\<V> > \<K extends SharedKey, V>(shared: SharedSet\<K, V>): ( f: (set: Set\<V>) => void, ) => Effect\<SharedEnv, ReadonlySet\<V>>}

*Defined in [src/Shared/set/withMutations.ts:10](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/set/withMutations.ts#L10)*

Expose a mutable access to a SharedSet.
