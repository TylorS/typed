**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/context/NamespaceConsumers"

# Module: "Shared/context/NamespaceConsumers"

## Index

### Variables

* [NamespaceConsumers](_shared_context_namespaceconsumers_.md#namespaceconsumers)
* [getNamespaceConsumers](_shared_context_namespaceconsumers_.md#getnamespaceconsumers)

## Variables

### NamespaceConsumers

• `Const` **NamespaceConsumers**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[Namespace](_shared_core_model_namespace_.namespace.md), Set\<Eq\<unknown>>>>> = createShared( Symbol.for('NamespaceConsumers'), Pure.fromIO(() => new Map\<SharedKey, Map\<Namespace, Set\<Eq\<unknown>>>>()),)

*Defined in [src/Shared/context/NamespaceConsumers.ts:8](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/context/NamespaceConsumers.ts#L8)*

Keep track of all of the namespaces currently consuming this namespace's values.

___

### getNamespaceConsumers

• `Const` **getNamespaceConsumers**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[Namespace](_shared_core_model_namespace_.namespace.md), Set\<Eq\<unknown>>>>> = getShared(NamespaceConsumers)

*Defined in [src/Shared/context/NamespaceConsumers.ts:16](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/context/NamespaceConsumers.ts#L16)*

Get the current namespace's consumers
