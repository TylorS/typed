**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/setShared"

# Module: "Shared/core/services/setShared"

## Index

### Variables

* [setShared](_shared_core_services_setshared_.md#setshared)

## Variables

### setShared

• `Const` **setShared**: \<S>(shared: S, value: [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>\<S>(shared: S) => (value: [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>> = curry( \<S extends Shared>( shared: S, value: GetSharedValue\<S>, ): Effect\<SharedEnv & GetSharedEnv\<S>, GetSharedValue\<S>> => doEffect(function* () { const current = yield* getShared(shared) // Always set the value if it's changed if (!Object.is(current, value)) { const store = yield* getKeyStore store.set(shared.key, value) } // Use Eq to determine if an event should be sent if (!shared.eq.equals(current, value)) { yield* sendSharedEvent({ type: 'sharedValue/updated', namespace: yield* getCurrentNamespace, shared, previousValue: current, value, }) } return value }),) as { \<S extends Shared>(shared: S, value: GetSharedValue\<S>): Effect\< SharedEnv & GetSharedEnv\<S>, GetSharedValue\<S> > \<S extends Shared>(shared: S): ( value: GetSharedValue\<S>, ) => Effect\<SharedEnv & GetSharedEnv\<S>, GetSharedValue\<S>>}

*Defined in [src/Shared/core/services/setShared.ts:14](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/services/setShared.ts#L14)*

Set the Shared Value.
