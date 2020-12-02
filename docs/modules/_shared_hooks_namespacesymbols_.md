**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/NamespaceSymbols"

# Module: "Shared/hooks/NamespaceSymbols"

## Index

### Variables

* [NamespaceSymbols](_shared_hooks_namespacesymbols_.md#namespacesymbols)
* [getNamespaceSymbols](_shared_hooks_namespacesymbols_.md#getnamespacesymbols)

## Variables

### NamespaceSymbols

• `Const` **NamespaceSymbols**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<number, symbol>> = createShared( Symbol.for('NamespaceSymbols'), Pure.fromIO(() => new Map\<number, symbol>()),)

*Defined in [src/Shared/hooks/NamespaceSymbols.ts:8](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/hooks/NamespaceSymbols.ts#L8)*

Keep track of a Map of positions to symbols to ensure
hooks never conflict with user-land code.

___

### getNamespaceSymbols

• `Const` **getNamespaceSymbols**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<number, symbol>> = getShared(NamespaceSymbols)

*Defined in [src/Shared/hooks/NamespaceSymbols.ts:16](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/hooks/NamespaceSymbols.ts#L16)*

Get NamespaceSymbols map.
