**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useDisposable"

# Module: "Shared/hooks/useDisposable"

## Index

### Functions

* [useDisposable](_shared_hooks_usedisposable_.md#usedisposable)

## Functions

### useDisposable

▸ `Const`**useDisposable**\<Deps>(`f`: () => Disposable, `deps`: Deps, `eqs?`: [EqsOf](_shared_common_eqsof_.md#eqsof)\<Deps>): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Disposable>

*Defined in [src/Shared/hooks/useDisposable.ts:15](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/hooks/useDisposable.ts#L15)*

Keep track of Disposable resources between runs.

#### Type parameters:

Name | Type |
------ | ------ |
`Deps` | ReadonlyArray\<any> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`f` | () => Disposable | - |
`deps` | Deps | - |
`eqs` | [EqsOf](_shared_common_eqsof_.md#eqsof)\<Deps> | defaultEqs(deps) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Disposable>
