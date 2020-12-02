**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/getKeyStores"

# Module: "Shared/core/services/getKeyStores"

## Index

### Variables

* [getKeyStores](_shared_core_services_getkeystores_.md#getkeystores)

## Variables

### getKeyStores

• `Const` **getKeyStores**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[Namespace](_shared_core_model_namespace_.namespace.md), [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)>> = asks( (e) => e.namespaceKeyStores,)

*Defined in [src/Shared/core/services/getKeyStores.ts:9](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/services/getKeyStores.ts#L9)*

Get all of the Shared key stores.
