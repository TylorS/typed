**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/handlers/core/coreHandlers"

# Module: "Shared/createSharedEnvProvider/handlers/core/coreHandlers"

## Index

### Variables

* [coreHandlers](_shared_createsharedenvprovider_handlers_core_corehandlers_.md#corehandlers)

## Variables

### coreHandlers

• `Const` **coreHandlers**: [[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)>] = [ createSharedEventHandler(namespaceDeletedGuard, namespaceDeleted),] as const

*Defined in [src/Shared/createSharedEnvProvider/handlers/core/coreHandlers.ts:10](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/createSharedEnvProvider/handlers/core/coreHandlers.ts#L10)*

The Shared handlers required for the core of Shared. It simply removes
resources it creates on your behalf. Feel free to otherwise replace this
with your own variant if you need.
