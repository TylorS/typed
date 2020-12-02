**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/NamespaceRenderers"

# Module: "Patch/NamespaceRenderers"

## Index

### Variables

* [NamespaceRenderers](_patch_namespacerenderers_.md#namespacerenderers)
* [addNamespaceRenderer](_patch_namespacerenderers_.md#addnamespacerenderer)
* [getNamespaceRenderers](_patch_namespacerenderers_.md#getnamespacerenderers)

## Variables

### NamespaceRenderers

• `Const` **NamespaceRenderers**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, Set\<[Namespace](_shared_core_model_namespace_.namespace.md)>> = createShared( Symbol.for('NamespaceRenderers'), Pure.fromIO(() => new Set\<Namespace>()),)

*Defined in [src/Patch/NamespaceRenderers.ts:16](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/NamespaceRenderers.ts#L16)*

Namespaces that are being used that can be patched directly.

___

### addNamespaceRenderer

• `Const` **addNamespaceRenderer**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void> = doEffect(function* () { const currentNamespace = yield* getCurrentNamespace const renderers = yield* getNamespaceRenderers if (renderers.has(currentNamespace)) { return } renderers.add(currentNamespace) yield* addDisposable({ dispose: () => renderers.delete(currentNamespace) })})

*Defined in [src/Patch/NamespaceRenderers.ts:29](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/NamespaceRenderers.ts#L29)*

Mark the current namespace

___

### getNamespaceRenderers

• `Const` **getNamespaceRenderers**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), Set\<[Namespace](_shared_core_model_namespace_.namespace.md)>> = pipe(NamespaceRenderers, getShared, usingGlobal)

*Defined in [src/Patch/NamespaceRenderers.ts:24](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/NamespaceRenderers.ts#L24)*

Get the Set of NamespaceRenderers
