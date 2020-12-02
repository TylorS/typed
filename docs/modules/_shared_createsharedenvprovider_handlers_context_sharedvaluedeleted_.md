**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/handlers/context/sharedValueDeleted"

# Module: "Shared/createSharedEnvProvider/handlers/context/sharedValueDeleted"

## Index

### Functions

* [deleteSharedValues](_shared_createsharedenvprovider_handlers_context_sharedvaluedeleted_.md#deletesharedvalues)
* [sharedValueDeleted](_shared_createsharedenvprovider_handlers_context_sharedvaluedeleted_.md#sharedvaluedeleted)

## Functions

### deleteSharedValues

▸ **deleteSharedValues**(`namespace`: [Namespace](_shared_core_model_namespace_.namespace.md), `shared`: [Shared](_shared_core_model_shared_.shared.md)): Generator\<[Env](_effect_effect_.md#env)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), any>, void, unknown>

*Defined in [src/Shared/createSharedEnvProvider/handlers/context/sharedValueDeleted.ts:14](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/createSharedEnvProvider/handlers/context/sharedValueDeleted.ts#L14)*

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | [Namespace](_shared_core_model_namespace_.namespace.md) |
`shared` | [Shared](_shared_core_model_shared_.shared.md) |

**Returns:** Generator\<[Env](_effect_effect_.md#env)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), any>, void, unknown>

___

### sharedValueDeleted

▸ **sharedValueDeleted**(`__namedParameters`: { namespace: [Namespace](_shared_core_model_namespace_.namespace.md) ; shared: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, any, any>  }): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

*Defined in [src/Shared/createSharedEnvProvider/handlers/context/sharedValueDeleted.ts:7](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/createSharedEnvProvider/handlers/context/sharedValueDeleted.ts#L7)*

#### Parameters:

Name | Type |
------ | ------ |
`__namedParameters` | { namespace: [Namespace](_shared_core_model_namespace_.namespace.md) ; shared: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, any, any>  } |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>
