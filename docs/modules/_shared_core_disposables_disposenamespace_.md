**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/disposables/disposeNamespace"

# Module: "Shared/core/disposables/disposeNamespace"

## Index

### Variables

* [disposeNamespace](_shared_core_disposables_disposenamespace_.md#disposenamespace)

## Variables

### disposeNamespace

• `Const` **disposeNamespace**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void> = doEffect(function* () { const keyStore = yield* getKeyStore const disposable = keyStore.get(NamespaceDisposable.key) disposable?.dispose()})

*Defined in [src/Shared/core/disposables/disposeNamespace.ts:9](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/core/disposables/disposeNamespace.ts#L9)*

Release all resources related to the current namespace
