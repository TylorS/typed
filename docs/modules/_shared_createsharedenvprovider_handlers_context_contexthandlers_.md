**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/handlers/context/contextHandlers"

# Module: "Shared/createSharedEnvProvider/handlers/context/contextHandlers"

## Index

### Variables

* [contextHandlers](_shared_createsharedenvprovider_handlers_context_contexthandlers_.md#contexthandlers)

## Variables

### contextHandlers

• `Const` **contextHandlers**: [[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceStarted](_shared_core_events_namespaceevent_.namespacestarted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[SharedValueDeleted](_shared_core_events_sharedvalueevent_.sharedvaluedeleted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)>] = [ createSharedEventHandler(namespaceDeletedGuard, namespaceDeleted), createSharedEventHandler(namespaceStartedGuard, namespaceStarted), createSharedEventHandler(sharedValueDeletedGuard, sharedValueDeleted), createSharedEventHandler(sharedValueUpdatedGuard, sharedValueUpdated),] as const

*Defined in [src/Shared/createSharedEnvProvider/handlers/context/contextHandlers.ts:17](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/createSharedEnvProvider/handlers/context/contextHandlers.ts#L17)*

All of the Shared handlers required to power the React Context-like API for
Shared.
