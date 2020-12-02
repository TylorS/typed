**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/disposables/NamespaceDisposable"

# Module: "Shared/core/disposables/NamespaceDisposable"

## Index

### Variables

* [NamespaceDisposable](_shared_core_disposables_namespacedisposable_.md#namespacedisposable)
* [getNamespaceDisposable](_shared_core_disposables_namespacedisposable_.md#getnamespacedisposable)

## Variables

### NamespaceDisposable

• `Const` **NamespaceDisposable**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, [LazyDisposable](../interfaces/_disposable_exports_.lazydisposable.md)> = createShared( Symbol.for('NamespaceDisposable'), Pure.fromIO((): LazyDisposable => lazy()),)

*Defined in [src/Shared/core/disposables/NamespaceDisposable.ts:11](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/core/disposables/NamespaceDisposable.ts#L11)*

Introduces a well-known place to associate resources with a given
Namespace.

___

### getNamespaceDisposable

• `Const` **getNamespaceDisposable**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [LazyDisposable](../interfaces/_disposable_exports_.lazydisposable.md)> = getShared(NamespaceDisposable)

*Defined in [src/Shared/core/disposables/NamespaceDisposable.ts:16](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/core/disposables/NamespaceDisposable.ts#L16)*
