**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/deleteKeyStore"

# Module: "Shared/core/services/deleteKeyStore"

## Index

### Functions

* [deleteKeyStore](_shared_core_services_deletekeystore_.md#deletekeystore)

## Functions

### deleteKeyStore

▸ `Const`**deleteKeyStore**(`namespace`: [Namespace](_shared_core_model_namespace_.namespace.md)): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<[SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)>>

*Defined in [src/Shared/core/services/deleteKeyStore.ts:13](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/services/deleteKeyStore.ts#L13)*

Delete a Namespace from NamespaceKeyStores, sending out a Deleted
event.

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | [Namespace](_shared_core_model_namespace_.namespace.md) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<[SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)>>
