**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useState"

# Module: "Shared/hooks/useState"

## Index

### Functions

* [useState](_shared_hooks_usestate_.md#usestate)

## Functions

### useState

▸ `Const`**useState**\<E, A>(`initial`: [Effect](_effect_effect_.effect.md)\<E, A>, `eq?`: Eq\<A>): [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [State](_shared_state_state_.md#state)\<A>>

*Defined in [src/Shared/hooks/useState.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/hooks/useState.ts#L14)*

Create a piece of local state

**`hook`** 

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`initial` | [Effect](_effect_effect_.effect.md)\<E, A> | - |
`eq` | Eq\<A> | deepEqualsEq |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [State](_shared_state_state_.md#state)\<A>>
