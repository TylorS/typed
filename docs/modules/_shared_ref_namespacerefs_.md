**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/Ref/NamespaceRefs"

# Module: "Shared/Ref/NamespaceRefs"

## Index

### Variables

* [NamespaceRefs](_shared_ref_namespacerefs_.md#namespacerefs)
* [getNamespaceRefs](_shared_ref_namespacerefs_.md#getnamespacerefs)

## Variables

### NamespaceRefs

• `Const` **NamespaceRefs**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, [Ref](../interfaces/_shared_ref_ref_.ref.md)\<any>>> = createShared( Symbol.for('NamespaceRefs'), Pure.fromIO(() => new Map\<SharedKey, Ref\<any>>()),)

*Defined in [src/Shared/Ref/NamespaceRefs.ts:9](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/Ref/NamespaceRefs.ts#L9)*

Memoize the creation of Ref objects wrapping Shared value.

___

### getNamespaceRefs

• `Const` **getNamespaceRefs**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, [Ref](../interfaces/_shared_ref_ref_.ref.md)\<any>>> = getShared(NamespaceRefs)

*Defined in [src/Shared/Ref/NamespaceRefs.ts:17](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/Ref/NamespaceRefs.ts#L17)*

Get a Map of References
