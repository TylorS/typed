**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useMemo"

# Module: "Shared/hooks/useMemo"

## Index

### Functions

* [useMemo](_shared_hooks_usememo_.md#usememo)

## Functions

### useMemo

▸ `Const`**useMemo**\<A, Deps>(`f`: () => A, `deps`: Deps, `eqs?`: [EqsOf](_shared_common_eqsof_.md#eqsof)\<Deps>): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), A>

*Defined in [src/Shared/hooks/useMemo.ts:12](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/hooks/useMemo.ts#L12)*

Memoize the result of a function.

**`hook`** 

#### Type parameters:

Name | Type |
------ | ------ |
`A` | - |
`Deps` | ReadonlyArray\<any> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`f` | () => A | - |
`deps` | Deps | - |
`eqs` | [EqsOf](_shared_common_eqsof_.md#eqsof)\<Deps> | defaultEqs(deps) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), A>
