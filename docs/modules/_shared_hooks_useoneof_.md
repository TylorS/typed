**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useOneOf"

# Module: "Shared/hooks/useOneOf"

## Index

### Functions

* [useOneOf](_shared_hooks_useoneof_.md#useoneof)

## Functions

### useOneOf

▸ `Const`**useOneOf**\<E, O, I, A>(`shared`: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md), E, O>, `input`: I, ...`matches`: A): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E, O>

*Defined in [src/Shared/hooks/useOneOf.ts:12](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/hooks/useOneOf.ts#L12)*

Keep track of the current match value.

#### Type parameters:

Name | Type |
------ | ------ |
`E` | - |
`O` | - |
`I` | - |
`A` | ReadonlyArray\<[Match](_logic_types_.match.md)\<I, O>> |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md), E, O> |
`input` | I |
`...matches` | A |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & E, O>
