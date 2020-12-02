**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/set/wrapSet"

# Module: "Shared/set/wrapSet"

## Index

### Functions

* [wrapSet](_shared_set_wrapset_.md#wrapset)

## Functions

### wrapSet

▸ `Const`**wrapSet**\<K, V>(`shared`: [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V>): object

*Defined in [src/Shared/set/wrapSet.ts:13](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/set/wrapSet.ts#L13)*

Wrap a Shared Set in common operations.

#### Type parameters:

Name | Type |
------ | ------ |
`K` | [SharedKey](_shared_core_model_sharedkey_.sharedkey.md) |
`V` | - |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)\<K, V> |

**Returns:** object

Name | Type |
------ | ------ |
`add` | (value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), ReadonlySet\<V>> |
`clear` | [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<ReadonlySet\<V>>> |
`delete` | (value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean> |
`has` | (value: V) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean> |
`size` | [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), number> |
`withMutations` | (f: (set: Set\<V>) => void) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), ReadonlySet\<V>> |
