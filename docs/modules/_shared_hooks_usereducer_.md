**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useReducer"

# Module: "Shared/hooks/useReducer"

## Index

### Functions

* [useReducer](_shared_hooks_usereducer_.md#usereducer)

## Functions

### useReducer

▸ `Const`**useReducer**\<A, B, E>(`reducer`: [Arity2](_common_types_.md#arity2)\<A, B, A>, `initial`: [Effect](_effect_effect_.effect.md)\<E, A>, `eq?`: Eq\<A>): [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [State](_shared_state_state_.md#state)\<A, B>>

*Defined in [src/Shared/hooks/useReducer.ts:15](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/hooks/useReducer.ts#L15)*

Use a Reducer to keep track of state.

#### Type parameters:

Name |
------ |
`A` |
`B` |
`E` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`reducer` | [Arity2](_common_types_.md#arity2)\<A, B, A> | - |
`initial` | [Effect](_effect_effect_.effect.md)\<E, A> | - |
`eq` | Eq\<A> | eqStrict |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [State](_shared_state_state_.md#state)\<A, B>>
