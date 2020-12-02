**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/withCurrentNamespace"

# Module: "Shared/core/services/withCurrentNamespace"

## Index

### Functions

* [withCurrentNamespace](_shared_core_services_withcurrentnamespace_.md#withcurrentnamespace)

## Functions

### withCurrentNamespace

▸ `Const`**withCurrentNamespace**\<E, A>(`f`: (namespace: [Namespace](_shared_core_model_namespace_.namespace.md)) => [EffectGenerator](_effect_effect_.md#effectgenerator)\<E, A>): [Effect](_effect_effect_.effect.md)\<[CurrentNamespaceEnv](../interfaces/_shared_core_services_currentnamespaceenv_.currentnamespaceenv.md) & E, A>

*Defined in [src/Shared/core/services/withCurrentNamespace.ts:10](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/core/services/withCurrentNamespace.ts#L10)*

Run an effect using the current namespace

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`f` | (namespace: [Namespace](_shared_core_model_namespace_.namespace.md)) => [EffectGenerator](_effect_effect_.md#effectgenerator)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[CurrentNamespaceEnv](../interfaces/_shared_core_services_currentnamespaceenv_.currentnamespaceenv.md) & E, A>
