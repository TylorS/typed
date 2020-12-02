**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/runWithNamespace"

# Module: "Shared/core/services/runWithNamespace"

## Index

### Variables

* [runWithNamespace](_shared_core_services_runwithnamespace_.md#runwithnamespace)

## Variables

### runWithNamespace

• `Const` **runWithNamespace**: \<E, A>(namespace: [Namespace](_shared_core_model_namespace_.namespace.md), effect: [Effect](_effect_effect_.effect.md)\<E, A>) => [Effect](_effect_effect_.effect.md)\<E, A>(namespace: [Namespace](_shared_core_model_namespace_.namespace.md)) => \<E, A>(effect: [Effect](_effect_effect_.effect.md)\<E, A>) => [Effect](_effect_effect_.effect.md)\<E, A> = curry( \<E extends SharedEnv, A>(namespace: Namespace, effect: Effect\<E, A>): Effect\<E, A> => { const eff = doEffect(function* () { const keyStores = yield* getKeyStores if (!keyStores.has(namespace)) { keyStores.set(namespace, new Map()) yield* sendSharedEvent({ type: 'namespace/created', namespace }) } const parent = yield* getCurrentNamespace yield* sendSharedEvent({ type: 'namespace/started', parent, namespace, effect, }) const returnValue = yield* pipe(effect, usingNamespace(namespace)) yield* sendSharedEvent({ type: 'namespace/completed', parent, namespace, effect, returnValue, }) return returnValue }) return eff },) as { \<E extends SharedEnv, A>(namespace: Namespace, effect: Effect\<E, A>): Effect\<E, A> (namespace: Namespace): \<E extends SharedEnv, A>(effect: Effect\<E, A>) => Effect\<E, A>}

*Defined in [src/Shared/core/services/runWithNamespace.ts:16](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/core/services/runWithNamespace.ts#L16)*

Run an effect using a particular namespace while providing namespace events and managing
the shared tree of namespaces.
