**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/getShared"

# Module: "Shared/core/services/getShared"

## Index

### Functions

* [createShared](_shared_core_services_getshared_.md#createshared)
* [getShared](_shared_core_services_getshared_.md#getshared)

## Functions

### createShared

▸ `Const`**createShared**\<S>(`shared`: S): [Effect](_effect_effect_.effect.md)\<[SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md) & [CurrentNamespaceEnv](../interfaces/_shared_core_services_currentnamespaceenv_.currentnamespaceenv.md), any>

*Defined in [src/Shared/core/services/getShared.ts:27](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/core/services/getShared.ts#L27)*

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md) & [CurrentNamespaceEnv](../interfaces/_shared_core_services_currentnamespaceenv_.currentnamespaceenv.md), any>

___

### getShared

▸ **getShared**\<S>(`shared`: S): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>

*Defined in [src/Shared/core/services/getShared.ts:14](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/core/services/getShared.ts#L14)*

Get the current Shared value for the current namespace. If one does not exist,
the currently configured initial Effect will be used to populate it.

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>
