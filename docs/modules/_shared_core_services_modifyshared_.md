**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/modifyShared"

# Module: "Shared/core/services/modifyShared"

## Index

### Variables

* [modifyShared](_shared_core_services_modifyshared_.md#modifyshared)

## Variables

### modifyShared

• `Const` **modifyShared**: \<S>(shared: S, f: [Arity1](_common_types_.md#arity1)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>\<S>(shared: S) => (f: [Arity1](_common_types_.md#arity1)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>> = curry( \<S extends Shared>( shared: S, f: Arity1\<GetSharedValue\<S>, GetSharedValue\<S>>, ): Effect\<SharedEnv & GetSharedEnv\<S>, GetSharedValue\<S>> => pipe(shared, getShared, map(f), chain(setShared(shared))),) as { \<S extends Shared>(shared: S, f: Arity1\<GetSharedValue\<S>, GetSharedValue\<S>>): Effect\< SharedEnv & GetSharedEnv\<S>, GetSharedValue\<S> > \<S extends Shared>(shared: S): ( f: Arity1\<GetSharedValue\<S>, GetSharedValue\<S>>, ) => Effect\<SharedEnv & GetSharedEnv\<S>, GetSharedValue\<S>>}

*Defined in [src/Shared/core/services/modifyShared.ts:14](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/core/services/modifyShared.ts#L14)*

Update the current Shared value.
