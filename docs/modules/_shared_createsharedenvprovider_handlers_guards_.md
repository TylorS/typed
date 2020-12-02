**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/handlers/guards"

# Module: "Shared/createSharedEnvProvider/handlers/guards"

## Index

### Variables

* [namespaceDeletedGuard](_shared_createsharedenvprovider_handlers_guards_.md#namespacedeletedguard)
* [namespaceStartedGuard](_shared_createsharedenvprovider_handlers_guards_.md#namespacestartedguard)
* [sharedValueDeletedGuard](_shared_createsharedenvprovider_handlers_guards_.md#sharedvaluedeletedguard)
* [sharedValueUpdatedGuard](_shared_createsharedenvprovider_handlers_guards_.md#sharedvalueupdatedguard)

## Variables

### namespaceDeletedGuard

• `Const` **namespaceDeletedGuard**: Guard\<unknown, [NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)> = createGuardFromSchema(NamespaceDeleted.schema)

*Defined in [src/Shared/createSharedEnvProvider/handlers/guards.ts:10](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/createSharedEnvProvider/handlers/guards.ts#L10)*

___

### namespaceStartedGuard

• `Const` **namespaceStartedGuard**: Guard\<unknown, [NamespaceStarted](_shared_core_events_namespaceevent_.namespacestarted.md)> = createGuardFromSchema(NamespaceStarted.schema)

*Defined in [src/Shared/createSharedEnvProvider/handlers/guards.ts:11](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/createSharedEnvProvider/handlers/guards.ts#L11)*

___

### sharedValueDeletedGuard

• `Const` **sharedValueDeletedGuard**: Guard\<unknown, [SharedValueDeleted](_shared_core_events_sharedvalueevent_.sharedvaluedeleted.md)> = createGuardFromSchema(SharedValueDeleted.schema)

*Defined in [src/Shared/createSharedEnvProvider/handlers/guards.ts:12](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/createSharedEnvProvider/handlers/guards.ts#L12)*

___

### sharedValueUpdatedGuard

• `Const` **sharedValueUpdatedGuard**: Guard\<unknown, [SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)> = createGuardFromSchema(SharedValueUpdated.schema)

*Defined in [src/Shared/createSharedEnvProvider/handlers/guards.ts:13](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/createSharedEnvProvider/handlers/guards.ts#L13)*
