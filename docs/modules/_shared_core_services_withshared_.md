**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/withShared"

# Module: "Shared/core/services/withShared"

## Index

### Functions

* [withShared](_shared_core_services_withshared_.md#withshared)

## Functions

### withShared

▸ `Const`**withShared**\<S, E, A>(`shared`: S, `f`: (value: [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>) => [EffectGenerator](_effect_effect_.md#effectgenerator)\<E, A>): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S> & E, A>

*Defined in [src/Shared/core/services/withShared.ts:11](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/services/withShared.ts#L11)*

Run an effect using a Shared value.

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |
`E` | - |
`A` | - |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |
`f` | (value: [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>) => [EffectGenerator](_effect_effect_.md#effectgenerator)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S> & E, A>
