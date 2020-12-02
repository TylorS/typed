**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/defaultHandlers"

# Module: "Shared/createSharedEnvProvider/defaultHandlers"

## Index

### Variables

* [defaultHandlers](_shared_createsharedenvprovider_defaulthandlers_.md#defaulthandlers)

## Variables

### defaultHandlers

• `Const` **defaultHandlers**: [[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceStarted](_shared_core_events_namespaceevent_.namespacestarted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[SharedValueDeleted](_shared_core_events_sharedvalueevent_.sharedvaluedeleted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceStarted](_shared_core_events_namespaceevent_.namespacestarted.md)>] = [...coreHandlers, ...contextHandlers, ...hooksHandlers] as const

*Defined in [src/Shared/createSharedEnvProvider/defaultHandlers.ts:8](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/createSharedEnvProvider/defaultHandlers.ts#L8)*

The default set of Shared event handlers providing the core functionality, as well as React-like Context + Hooks APIs.
