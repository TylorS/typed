**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/hasShared"

# Module: "Shared/core/services/hasShared"

## Index

### Functions

* [hasShared](_shared_core_services_hasshared_.md#hasshared)

## Functions

### hasShared

▸ `Const`**hasShared**\<S>(`shared`: S): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean>

*Defined in [src/Shared/core/services/hasShared.ts:10](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/core/services/hasShared.ts#L10)*

Check to see if the current Namespace has the given Shared value.

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean>
