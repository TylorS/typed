**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useListEffect"

# Module: "Shared/hooks/useListEffect"

## Index

### Type aliases

* [ListEffectOptions](_shared_hooks_uselisteffect_.md#listeffectoptions)

### Functions

* [useListEffect](_shared_hooks_uselisteffect_.md#uselisteffect)

## Type aliases

### ListEffectOptions

Ƭ  **ListEffectOptions**\<A>: { onDelete?: undefined \| (value: A, index: number) => void  }

*Defined in [src/Shared/hooks/useListEffect.ts:18](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/hooks/useListEffect.ts#L18)*

#### Type parameters:

Name |
------ |
`A` |

#### Type declaration:

Name | Type |
------ | ------ |
`onDelete?` | undefined \| (value: A, index: number) => void |

## Functions

### useListEffect

▸ **useListEffect**\<A, E, B>(`list`: ReadonlyArray\<A>, `toNamespace`: [Arity1](_common_types_.md#arity1)\<A, [Namespace](_shared_core_model_namespace_.namespace.md)>, `f`: (value: A, index: number) => [Effect](_effect_effect_.effect.md)\<E, B>, `eq?`: Eq\<A>): [Effect](_effect_effect_.effect.md)\<E & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), ReadonlyArray\<B>>

*Defined in [src/Shared/hooks/useListEffect.ts:25](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/hooks/useListEffect.ts#L25)*

Reform an effect over a list of values only as the values change.

#### Type parameters:

Name | Type |
------ | ------ |
`A` | - |
`E` | [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) |
`B` | - |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`list` | ReadonlyArray\<A> | - |
`toNamespace` | [Arity1](_common_types_.md#arity1)\<A, [Namespace](_shared_core_model_namespace_.namespace.md)> | - |
`f` | (value: A, index: number) => [Effect](_effect_effect_.effect.md)\<E, B> | - |
`eq` | Eq\<A> | deepEqualsEq |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), ReadonlyArray\<B>>
