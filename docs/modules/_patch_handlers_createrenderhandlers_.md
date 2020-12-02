**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/handlers/createRenderHandlers"

# Module: "Patch/handlers/createRenderHandlers"

## Index

### Variables

* [namespaceCompletedGuard](_patch_handlers_createrenderhandlers_.md#namespacecompletedguard)
* [namespaceDeletedGuard](_patch_handlers_createrenderhandlers_.md#namespacedeletedguard)
* [namespaceUpdatedGuard](_patch_handlers_createrenderhandlers_.md#namespaceupdatedguard)
* [sharedValueUpdatedGuard](_patch_handlers_createrenderhandlers_.md#sharedvalueupdatedguard)

### Functions

* [createRenderHandlers](_patch_handlers_createrenderhandlers_.md#createrenderhandlers)

## Variables

### namespaceCompletedGuard

• `Const` **namespaceCompletedGuard**: Guard\<unknown, [NamespaceCompleted](_shared_core_events_namespaceevent_.namespacecompleted.md)> = createGuardFromSchema(NamespaceCompleted.schema)

*Defined in [src/Patch/handlers/createRenderHandlers.ts:15](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/handlers/createRenderHandlers.ts#L15)*

___

### namespaceDeletedGuard

• `Const` **namespaceDeletedGuard**: Guard\<unknown, [NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)> = createGuardFromSchema(NamespaceDeleted.schema)

*Defined in [src/Patch/handlers/createRenderHandlers.ts:16](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/handlers/createRenderHandlers.ts#L16)*

___

### namespaceUpdatedGuard

• `Const` **namespaceUpdatedGuard**: Guard\<unknown, [NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md)> = createGuardFromSchema(NamespaceUpdated.schema)

*Defined in [src/Patch/handlers/createRenderHandlers.ts:17](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/handlers/createRenderHandlers.ts#L17)*

___

### sharedValueUpdatedGuard

• `Const` **sharedValueUpdatedGuard**: Guard\<unknown, [SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)> = createGuardFromSchema(SharedValueUpdated.schema)

*Defined in [src/Patch/handlers/createRenderHandlers.ts:18](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/handlers/createRenderHandlers.ts#L18)*

## Functions

### createRenderHandlers

▸ **createRenderHandlers**\<A, B>(`Patch`: [Patch](../interfaces/_patch_patch_.patch.md)\<A, B>): [[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceCompleted](_shared_core_events_namespaceevent_.namespacecompleted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)>]

*Defined in [src/Patch/handlers/createRenderHandlers.ts:24](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/handlers/createRenderHandlers.ts#L24)*

Creates a version of the Render Handlers that will Patch a Namespace
as soon as it receives an Update.

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`Patch` | [Patch](../interfaces/_patch_patch_.patch.md)\<A, B> |

**Returns:** [[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceCompleted](_shared_core_events_namespaceevent_.namespacecompleted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)>]
