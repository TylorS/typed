**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/constructors/createShared"

# Module: "Shared/core/constructors/createShared"

## Index

### Functions

* [createShared](_shared_core_constructors_createshared_.md#createshared)

## Functions

### createShared

▸ **createShared**\<K, E, A>(`key`: K, `initial`: [Effect](_effect_effect_.effect.md)\<E, A>, `eq?`: Eq\<A>): [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<K>, E, A>

*Defined in [src/Shared/core/constructors/createShared.ts:10](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/constructors/createShared.ts#L10)*

Contstruct a share value

#### Type parameters:

Name | Type |
------ | ------ |
`K` | PropertyKey |
`E` | - |
`A` | - |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`key` | K | - |
`initial` | [Effect](_effect_effect_.effect.md)\<E, A> | - |
`eq` | Eq\<A> | eqStrict |

**Returns:** [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<K>, E, A>
