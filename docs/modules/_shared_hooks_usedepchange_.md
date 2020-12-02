**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useDepChange"

# Module: "Shared/hooks/useDepChange"

## Index

### Functions

* [useDepChange](_shared_hooks_usedepchange_.md#usedepchange)

## Functions

### useDepChange

▸ `Const`**useDepChange**\<A>(`value`: A, `eq`: Eq\<A>, `first?`: boolean): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean>

*Defined in [src/Shared/hooks/useDepChange.ts:11](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/hooks/useDepChange.ts#L11)*

Track if a value has changed

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`value` | A | - |
`eq` | Eq\<A> | - |
`first` | boolean | true |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean>
