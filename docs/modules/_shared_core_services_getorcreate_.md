**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/getOrCreate"

# Module: "Shared/core/services/getOrCreate"

## Index

### Functions

* [getOrCreate](_shared_core_services_getorcreate_.md#getorcreate)

## Functions

### getOrCreate

▸ `Const`**getOrCreate**\<A, B, E>(`map`: [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<A, B>, `key`: A, `or`: () => [Effect](_effect_effect_.effect.md)\<E, B>): [Effect](_effect_effect_.effect.md)\<E, B>

*Defined in [src/Shared/core/services/getOrCreate.ts:7](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/services/getOrCreate.ts#L7)*

Get the current value within a map or create the value. This allows for
a "just-in-time" computation of state.

#### Type parameters:

Name |
------ |
`A` |
`B` |
`E` |

#### Parameters:

Name | Type |
------ | ------ |
`map` | [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<A, B> |
`key` | A |
`or` | () => [Effect](_effect_effect_.effect.md)\<E, B> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, B>
