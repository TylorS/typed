**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/handlers/createWhenIdleHandlers"

# Module: "Patch/handlers/createWhenIdleHandlers"

## Index

### Variables

* [namespaceCompletedGuard](_patch_handlers_createwhenidlehandlers_.md#namespacecompletedguard)
* [namespaceDeletedGuard](_patch_handlers_createwhenidlehandlers_.md#namespacedeletedguard)
* [namespaceUpdatedGuard](_patch_handlers_createwhenidlehandlers_.md#namespaceupdatedguard)
* [sharedValueUpdatedGuard](_patch_handlers_createwhenidlehandlers_.md#sharedvalueupdatedguard)

### Functions

* [createWhenIdleHandlers](_patch_handlers_createwhenidlehandlers_.md#createwhenidlehandlers)

## Variables

### namespaceCompletedGuard

• `Const` **namespaceCompletedGuard**: Guard\<unknown, [NamespaceCompleted](_shared_core_events_namespaceevent_.namespacecompleted.md)> = createGuardFromSchema(NamespaceCompleted.schema)

*Defined in [src/Patch/handlers/createWhenIdleHandlers.ts:22](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Patch/handlers/createWhenIdleHandlers.ts#L22)*

___

### namespaceDeletedGuard

• `Const` **namespaceDeletedGuard**: Guard\<unknown, [NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)> = createGuardFromSchema(NamespaceDeleted.schema)

*Defined in [src/Patch/handlers/createWhenIdleHandlers.ts:23](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Patch/handlers/createWhenIdleHandlers.ts#L23)*

___

### namespaceUpdatedGuard

• `Const` **namespaceUpdatedGuard**: Guard\<unknown, [NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md)> = createGuardFromSchema(NamespaceUpdated.schema)

*Defined in [src/Patch/handlers/createWhenIdleHandlers.ts:24](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Patch/handlers/createWhenIdleHandlers.ts#L24)*

___

### sharedValueUpdatedGuard

• `Const` **sharedValueUpdatedGuard**: Guard\<unknown, [SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)> = createGuardFromSchema(SharedValueUpdated.schema)

*Defined in [src/Patch/handlers/createWhenIdleHandlers.ts:25](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Patch/handlers/createWhenIdleHandlers.ts#L25)*

## Functions

### createWhenIdleHandlers

▸ **createWhenIdleHandlers**\<A, B>(`env`: [Patch](../interfaces/_patch_patch_.patch.md)\<A, B> & [WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md)): [[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceCompleted](_shared_core_events_namespaceevent_.namespacecompleted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)>]

*Defined in [src/Patch/handlers/createWhenIdleHandlers.ts:31](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Patch/handlers/createWhenIdleHandlers.ts#L31)*

Creates a version of the Render Handlers that will Patch a Namespace
as soon when the browser is idle.

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`env` | [Patch](../interfaces/_patch_patch_.patch.md)\<A, B> & [WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md) |

**Returns:** [[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceCompleted](_shared_core_events_namespaceevent_.namespacecompleted.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)>, [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<[NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)>]
