**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/context/withProvider"

# Module: "Shared/context/withProvider"

## Index

### Functions

* [findProvider](_shared_context_withprovider_.md#findprovider)
* [withProvider](_shared_context_withprovider_.md#withprovider)

## Functions

### findProvider

▸ **findProvider**\<S>(`shared`: S, `namespace`: [Namespace](_shared_core_model_namespace_.namespace.md), `states`: [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[Namespace](_shared_core_model_namespace_.namespace.md), [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)\<[Shared](_shared_core_model_shared_.shared.md)>>): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Namespace](_shared_core_model_namespace_.namespace.md)>

*Defined in [src/Shared/context/withProvider.ts:57](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/context/withProvider.ts#L57)*

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |
`namespace` | [Namespace](_shared_core_model_namespace_.namespace.md) |
`states` | [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[Namespace](_shared_core_model_namespace_.namespace.md), [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)\<[Shared](_shared_core_model_shared_.shared.md)>> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Namespace](_shared_core_model_namespace_.namespace.md)>

___

### withProvider

▸ `Const`**withProvider**\<S, E, A>(`shared`: S, `f`: (provider: [Namespace](_shared_core_model_namespace_.namespace.md)) => [Effect](_effect_effect_.effect.md)\<E, A>): [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, A>

*Defined in [src/Shared/context/withProvider.ts:31](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/context/withProvider.ts#L31)*

Uses the tree-like nature of namespaces to traverse "up"
to find the provider of Shared value. If none has been provided
it will use the root of the tree as the provider to store
the initial value. Very similar to React's useContext. If you'd
like to only be updated based on a specific part of the state, provide
a new Eq instance (tip: see contramap in fp-ts/Eq).

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |
`E` | - |
`A` | - |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |
`f` | (provider: [Namespace](_shared_core_model_namespace_.namespace.md)) => [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, A>
