**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/getDeleteNamespace"

# Module: "Shared/core/services/getDeleteNamespace"

## Index

### Variables

* [getDeleteNamesace](_shared_core_services_getdeletenamespace_.md#getdeletenamesace)

## Variables

### getDeleteNamesace

• `Const` **getDeleteNamesace**: [Effect](_effect_effect_.effect.md)\<[CurrentNamespaceEnv](../interfaces/_shared_core_services_currentnamespaceenv_.currentnamespaceenv.md) & [SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md), (Anonymous function)> = withCurrentNamespace(function* (namespace) { const sendEvent = yield* getSendSharedEvent return () => sendEvent({ type: 'namespace/deleted', namespace })})

*Defined in [src/Shared/core/services/getDeleteNamespace.ts:8](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/services/getDeleteNamespace.ts#L8)*

Get access to an IO that will delete the current namespace. Useful for
hooking into other system's lifecycle events.
