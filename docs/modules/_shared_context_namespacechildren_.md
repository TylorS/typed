**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/context/NamespaceChildren"

# Module: "Shared/context/NamespaceChildren"

## Index

### Variables

* [NamespaceChildren](_shared_context_namespacechildren_.md#namespacechildren)
* [getNamespaceChildren](_shared_context_namespacechildren_.md#getnamespacechildren)

### Functions

* [addChild](_shared_context_namespacechildren_.md#addchild)
* [removeChild](_shared_context_namespacechildren_.md#removechild)

## Variables

### NamespaceChildren

• `Const` **NamespaceChildren**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, Set\<[Namespace](_shared_core_model_namespace_.namespace.md)>> = createShared( Symbol.for('NamespaceChildren'), Pure.fromIO((): Set\<Namespace> => new Set()),)

*Defined in [src/Shared/context/NamespaceChildren.ts:7](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/context/NamespaceChildren.ts#L7)*

Keep track of all of the "child" namespaces in the tree of namespaces.

___

### getNamespaceChildren

• `Const` **getNamespaceChildren**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Set\<[Namespace](_shared_core_model_namespace_.namespace.md)>> = getShared(NamespaceChildren)

*Defined in [src/Shared/context/NamespaceChildren.ts:15](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/context/NamespaceChildren.ts#L15)*

Get the current namespace's children.

## Functions

### addChild

▸ `Const`**addChild**(`child`: [Namespace](_shared_core_model_namespace_.namespace.md)): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

*Defined in [src/Shared/context/NamespaceChildren.ts:20](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/context/NamespaceChildren.ts#L20)*

Add a namespace to the current namespace

#### Parameters:

Name | Type |
------ | ------ |
`child` | [Namespace](_shared_core_model_namespace_.namespace.md) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

___

### removeChild

▸ `Const`**removeChild**(`child`: [Namespace](_shared_core_model_namespace_.namespace.md)): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

*Defined in [src/Shared/context/NamespaceChildren.ts:30](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/context/NamespaceChildren.ts#L30)*

Remove a namespace from the current namespace

#### Parameters:

Name | Type |
------ | ------ |
`child` | [Namespace](_shared_core_model_namespace_.namespace.md) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>
