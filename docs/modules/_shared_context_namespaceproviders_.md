**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/context/NamespaceProviders"

# Module: "Shared/context/NamespaceProviders"

## Index

### Variables

* [NamespaceProviders](_shared_context_namespaceproviders_.md#namespaceproviders)
* [getNamspaceProviders](_shared_context_namespaceproviders_.md#getnamspaceproviders)

## Variables

### NamespaceProviders

• `Const` **NamespaceProviders**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, Set\<[Namespace](_shared_core_model_namespace_.namespace.md)>> = createShared( Symbol.for('NamespaceProviders'), Pure.fromIO(() => new Set\<Namespace>()),)

*Defined in [src/Shared/context/NamespaceProviders.ts:7](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/context/NamespaceProviders.ts#L7)*

Get the current Namespace's providers of values.

___

### getNamspaceProviders

• `Const` **getNamspaceProviders**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Set\<[Namespace](_shared_core_model_namespace_.namespace.md)>> = getShared(NamespaceProviders)

*Defined in [src/Shared/context/NamespaceProviders.ts:15](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/context/NamespaceProviders.ts#L15)*

Get the current Namespace's providers of values.
