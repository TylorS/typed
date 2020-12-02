**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/handlers/context/namespaceDeleted"

# Module: "Shared/createSharedEnvProvider/handlers/context/namespaceDeleted"

## Index

### Functions

* [deleteConsumers](_shared_createsharedenvprovider_handlers_context_namespacedeleted_.md#deleteconsumers)
* [namespaceDeleted](_shared_createsharedenvprovider_handlers_context_namespacedeleted_.md#namespacedeleted)

## Functions

### deleteConsumers

▸ **deleteConsumers**(`namespace`: [Namespace](_shared_core_model_namespace_.namespace.md)): Generator\<[Env](_effect_effect_.md#env)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), any>, void, unknown>

*Defined in [src/Shared/createSharedEnvProvider/handlers/context/namespaceDeleted.ts:13](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/createSharedEnvProvider/handlers/context/namespaceDeleted.ts#L13)*

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | [Namespace](_shared_core_model_namespace_.namespace.md) |

**Returns:** Generator\<[Env](_effect_effect_.md#env)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), any>, void, unknown>

___

### namespaceDeleted

▸ **namespaceDeleted**(`event`: [NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

*Defined in [src/Shared/createSharedEnvProvider/handlers/context/namespaceDeleted.ts:6](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/createSharedEnvProvider/handlers/context/namespaceDeleted.ts#L6)*

#### Parameters:

Name | Type |
------ | ------ |
`event` | [NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>
