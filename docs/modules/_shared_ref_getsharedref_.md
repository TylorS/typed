**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/Ref/getSharedRef"

# Module: "Shared/Ref/getSharedRef"

## Index

### Functions

* [getSharedRef](_shared_ref_getsharedref_.md#getsharedref)

## Functions

### getSharedRef

▸ `Const`**getSharedRef**\<S>(`shared`: S): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [Ref](../interfaces/_shared_ref_ref_.ref.md)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>>

*Defined in [src/Shared/Ref/getSharedRef.ts:16](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/Ref/getSharedRef.ts#L16)*

Get a shared value as a Reference

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [Ref](../interfaces/_shared_ref_ref_.ref.md)\<[GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>>
