**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/context/useContextReducer"

# Module: "Shared/context/useContextReducer"

## Index

### Functions

* [useContextReducer](_shared_context_usecontextreducer_.md#usecontextreducer)

## Functions

### useContextReducer

▸ `Const`**useContextReducer**\<S, A>(`shared`: S, `reducer`: [Arity2](_common_types_.md#arity2)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>, A, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [State](_shared_state_state_.md#state)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>, A>>

*Defined in [src/Shared/context/useContextReducer.ts:13](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/context/useContextReducer.ts#L13)*

Apply a reducer to a contextual value.

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |
`A` | - |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |
`reducer` | [Arity2](_common_types_.md#arity2)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>, A, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [State](_shared_state_state_.md#state)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>, A>>
