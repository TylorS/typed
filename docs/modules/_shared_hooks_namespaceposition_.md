**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/NamespacePosition"

# Module: "Shared/hooks/NamespacePosition"

## Index

### Variables

* [NamespacePosition](_shared_hooks_namespaceposition_.md#namespaceposition)
* [getNamespacePosition](_shared_hooks_namespaceposition_.md#getnamespaceposition)

## Variables

### NamespacePosition

• `Const` **NamespacePosition**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, [Ref](../interfaces/_shared_ref_ref_.ref.md)\<number>> = createShared( Symbol.for('NamespacePositions'), Pure.fromIO(() => createRef(0)),)

*Defined in [src/Shared/hooks/NamespacePosition.ts:9](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/hooks/NamespacePosition.ts#L9)*

Keep track of the current hook's position

___

### getNamespacePosition

• `Const` **getNamespacePosition**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Ref](../interfaces/_shared_ref_ref_.ref.md)\<number>> = getShared(NamespacePosition)

*Defined in [src/Shared/hooks/NamespacePosition.ts:17](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/hooks/NamespacePosition.ts#L17)*

Get the current hook position.
