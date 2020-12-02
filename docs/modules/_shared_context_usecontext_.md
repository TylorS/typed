**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/context/useContext"

# Module: "Shared/context/useContext"

## Index

### Functions

* [useContext](_shared_context_usecontext_.md#usecontext)

## Functions

### useContext

▸ `Const`**useContext**\<S>(`shared`: S): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>

*Defined in [src/Shared/context/useContext.ts:17](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/context/useContext.ts#L17)*

Use a tree of namespaces to retrieve the closest provider for a given Shared key.

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>>
