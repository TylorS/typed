**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/handlers/context/sharedValueUpdated"

# Module: "Shared/createSharedEnvProvider/handlers/context/sharedValueUpdated"

## Index

### Functions

* [sharedValueUpdated](_shared_createsharedenvprovider_handlers_context_sharedvalueupdated_.md#sharedvalueupdated)
* [updateSharedValue](_shared_createsharedenvprovider_handlers_context_sharedvalueupdated_.md#updatesharedvalue)

## Functions

### sharedValueUpdated

▸ **sharedValueUpdated**(`__namedParameters`: { namespace: [Namespace](_shared_core_model_namespace_.namespace.md) ; previousValue: unknown ; shared: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, any, any> ; value: unknown  }): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

*Defined in [src/Shared/createSharedEnvProvider/handlers/context/sharedValueUpdated.ts:12](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/createSharedEnvProvider/handlers/context/sharedValueUpdated.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`__namedParameters` | { namespace: [Namespace](_shared_core_model_namespace_.namespace.md) ; previousValue: unknown ; shared: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, any, any> ; value: unknown  } |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

___

### updateSharedValue

▸ **updateSharedValue**(`shared`: [Shared](_shared_core_model_shared_.shared.md), `previousValue`: unknown, `value`: unknown): Generator\<[Env](_effect_effect_.md#env)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), any>, void, unknown>

*Defined in [src/Shared/createSharedEnvProvider/handlers/context/sharedValueUpdated.ts:24](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/createSharedEnvProvider/handlers/context/sharedValueUpdated.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`shared` | [Shared](_shared_core_model_shared_.shared.md) |
`previousValue` | unknown |
`value` | unknown |

**Returns:** Generator\<[Env](_effect_effect_.md#env)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), any>, void, unknown>
