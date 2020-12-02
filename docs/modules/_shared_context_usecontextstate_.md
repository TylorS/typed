**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/context/useContextState"

# Module: "Shared/context/useContextState"

## Index

### Functions

* [useContextState](_shared_context_usecontextstate_.md#usecontextstate)

## Functions

### useContextState

▸ `Const`**useContextState**\<S>(`shared`: S): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [State](_shared_state_state_.md#state)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>>

*Defined in [src/Shared/context/useContextState.ts:17](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/context/useContextState.ts#L17)*

Get a State for a contextual value.

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [State](_shared_state_state_.md#state)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>>
