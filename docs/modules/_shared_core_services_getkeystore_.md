**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/getKeyStore"

# Module: "Shared/core/services/getKeyStore"

## Index

### Variables

* [getKeyStore](_shared_core_services_getkeystore_.md#getkeystore)

### Functions

* [createNewKeyStore](_shared_core_services_getkeystore_.md#createnewkeystore)

## Variables

### getKeyStore

• `Const` **getKeyStore**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)> = doEffect(function* () { const namespace = yield* getCurrentNamespace const keyStores = yield* getKeyStores return yield* getOrCreate(keyStores, namespace, createNewKeyStore)})

*Defined in [src/Shared/core/services/getKeyStore.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/services/getKeyStore.ts#L14)*

Get the current namespace's KeyStore

## Functions

### createNewKeyStore

▸ `Const`**createNewKeyStore**(): [Effect](_effect_effect_.effect.md)\<[SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md) & [CurrentNamespaceEnv](../interfaces/_shared_core_services_currentnamespaceenv_.currentnamespaceenv.md), [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)>

*Defined in [src/Shared/core/services/getKeyStore.ts:21](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/services/getKeyStore.ts#L21)*

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md) & [CurrentNamespaceEnv](../interfaces/_shared_core_services_currentnamespaceenv_.currentnamespaceenv.md), [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)>
