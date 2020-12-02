**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/context/NamespaceParent"

# Module: "Shared/context/NamespaceParent"

## Index

### Variables

* [NamespaceParent](_shared_context_namespaceparent_.md#namespaceparent)
* [getNamespaceParent](_shared_context_namespaceparent_.md#getnamespaceparent)
* [setNamespaceParent](_shared_context_namespaceparent_.md#setnamespaceparent)

## Variables

### NamespaceParent

• `Const` **NamespaceParent**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, Option\<[Namespace](_shared_core_model_namespace_.namespace.md)>> = createShared( Symbol.for('NamespaceParent'), Pure.fromIO((): Option\<Namespace> => none),)

*Defined in [src/Shared/context/NamespaceParent.ts:8](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/context/NamespaceParent.ts#L8)*

Keep reference to the current namespace's parent, if any.

___

### getNamespaceParent

• `Const` **getNamespaceParent**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Option\<[Namespace](_shared_core_model_namespace_.namespace.md)>> = getShared(NamespaceParent)

*Defined in [src/Shared/context/NamespaceParent.ts:16](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/context/NamespaceParent.ts#L16)*

Get the current Namespace's parent

___

### setNamespaceParent

• `Const` **setNamespaceParent**: (value: [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)\<S>, [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>> = setShared(NamespaceParent)

*Defined in [src/Shared/context/NamespaceParent.ts:21](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/context/NamespaceParent.ts#L21)*

Set the current Namespace's parent
