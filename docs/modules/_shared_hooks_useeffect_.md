**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useEffect"

# Module: "Shared/hooks/useEffect"

## Index

### Functions

* [useEffect](_shared_hooks_useeffect_.md#useeffect)

## Functions

### useEffect

▸ `Const`**useEffect**\<E, A, Deps>(`effect`: [Effect](_effect_effect_.effect.md)\<E, A>, `deps`: Deps, `eqs?`: [EqsOf](_shared_common_eqsof_.md#eqsof)\<Deps>): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Disposable>

*Defined in [src/Shared/hooks/useEffect.ts:15](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/hooks/useEffect.ts#L15)*

Schedule to perform an Effect everytime the dependencies change,
as defined by the (optionally) provided Eq instances.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`E` | - | - |
`A` | - | - |
`Deps` | ReadonlyArray\<unknown> | ReadonlyArray\\<unknown> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> | - |
`deps` | Deps | - |
`eqs` | [EqsOf](_shared_common_eqsof_.md#eqsof)\<Deps> | defaultEqs(deps) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Disposable>
