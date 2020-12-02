**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/services/SharedEnv"](../modules/_shared_core_services_sharedenv_.md) / SharedEnv

# Interface: SharedEnv

An environment type for all the things required to power Shared with lifecycle events.

## Hierarchy

* [CurrentNamespaceEnv](_shared_core_services_currentnamespaceenv_.currentnamespaceenv.md)

* [NamespaceKeyStoresEnv](_shared_core_services_namespacekeystoresenv_.namespacekeystoresenv.md)

* [SharedEventEnv](_shared_core_events_sharedeventenv_.sharedeventenv.md)

  ↳ **SharedEnv**

## Index

### Properties

* [namespaceKeyStores](_shared_core_services_sharedenv_.sharedenv.md#namespacekeystores)

## Properties

### namespaceKeyStores

• `Readonly` **namespaceKeyStores**: [Map](_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[Namespace](../modules/_shared_core_model_namespace_.namespace.md), [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md)>

*Inherited from [NamespaceKeyStoresEnv](_shared_core_services_namespacekeystoresenv_.namespacekeystoresenv.md).[namespaceKeyStores](_shared_core_services_namespacekeystoresenv_.namespacekeystoresenv.md#namespacekeystores)*

*Defined in [src/Shared/core/services/NamespaceKeyStoresEnv.ts:4](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/services/NamespaceKeyStoresEnv.ts#L4)*
