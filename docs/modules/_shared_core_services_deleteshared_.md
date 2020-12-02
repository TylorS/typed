**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/deleteShared"

# Module: "Shared/core/services/deleteShared"

## Index

### Functions

* [deleteShared](_shared_core_services_deleteshared_.md#deleteshared)

## Functions

### deleteShared

▸ `Const`**deleteShared**\<S>(`shared`: S): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, Option\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>>

*Defined in [src/Shared/core/services/deleteShared.ts:13](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/services/deleteShared.ts#L13)*

Delete the current Shared value. This will allow the next getShared to reset the value.

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, Option\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>>
