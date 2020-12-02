**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/State/getSharedState"

# Module: "Shared/State/getSharedState"

## Index

### Functions

* [createSharedState](_shared_state_getsharedstate_.md#createsharedstate)
* [getSharedState](_shared_state_getsharedstate_.md#getsharedstate)

## Functions

### createSharedState

▸ **createSharedState**\<S>(`shared`: S): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [EnvOf](_effect_effect_.md#envof)\<S["initial"]>, [State](_shared_state_state_.md#state)\<[ReturnOf](_effect_effect_.md#returnof)\<S["initial"]>, [ReturnOf](_effect_effect_.md#returnof)\<S["initial"]>>>

*Defined in [src/Shared/State/getSharedState.ts:30](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/State/getSharedState.ts#L30)*

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [EnvOf](_effect_effect_.md#envof)\<S["initial"]>, [State](_shared_state_state_.md#state)\<[ReturnOf](_effect_effect_.md#returnof)\<S["initial"]>, [ReturnOf](_effect_effect_.md#returnof)\<S["initial"]>>>

___

### getSharedState

▸ `Const`**getSharedState**\<S>(`shared`: S): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [State](_shared_state_state_.md#state)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>>

*Defined in [src/Shared/State/getSharedState.ts:21](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/State/getSharedState.ts#L21)*

Get a Shared value as a State object

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [State](_shared_state_state_.md#state)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>>
