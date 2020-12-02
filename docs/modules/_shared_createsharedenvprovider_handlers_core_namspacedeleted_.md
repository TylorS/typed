**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/handlers/core/namspaceDeleted"

# Module: "Shared/createSharedEnvProvider/handlers/core/namspaceDeleted"

## Index

### Functions

* [deleteNamespace](_shared_createsharedenvprovider_handlers_core_namspacedeleted_.md#deletenamespace)
* [namespaceDeleted](_shared_createsharedenvprovider_handlers_core_namspacedeleted_.md#namespacedeleted)

## Functions

### deleteNamespace

▸ **deleteNamespace**(`namespace`: [Namespace](_shared_core_model_namespace_.namespace.md)): [EffectGenerator](_effect_effect_.md#effectgenerator)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

*Defined in [src/Shared/createSharedEnvProvider/handlers/core/namspaceDeleted.ts:19](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/createSharedEnvProvider/handlers/core/namspaceDeleted.ts#L19)*

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | [Namespace](_shared_core_model_namespace_.namespace.md) |

**Returns:** [EffectGenerator](_effect_effect_.md#effectgenerator)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

___

### namespaceDeleted

▸ **namespaceDeleted**(`event`: [NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

*Defined in [src/Shared/createSharedEnvProvider/handlers/core/namspaceDeleted.ts:12](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/createSharedEnvProvider/handlers/core/namspaceDeleted.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`event` | [NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>
