**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/listenToSharedUpdates"

# Module: "Shared/hooks/listenToSharedUpdates"

## Index

### Variables

* [sharedValueUpdatedGuard](_shared_hooks_listentosharedupdates_.md#sharedvalueupdatedguard)

### Functions

* [listenToSharedUpdates](_shared_hooks_listentosharedupdates_.md#listentosharedupdates)

## Variables

### sharedValueUpdatedGuard

• `Const` **sharedValueUpdatedGuard**: Guard\<unknown, [SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)> = createGuardFromSchema(SharedValueUpdated.schema)

*Defined in [src/Shared/hooks/listenToSharedUpdates.ts:12](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/hooks/listenToSharedUpdates.ts#L12)*

## Functions

### listenToSharedUpdates

▸ **listenToSharedUpdates**\<S>(`shared`: S, `onUpdate`: (update: [SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md) & { shared: S  }) => void): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Disposable>

*Defined in [src/Shared/hooks/listenToSharedUpdates.ts:17](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/hooks/listenToSharedUpdates.ts#L17)*

Listen to the Updates of a Shared Value in the current Namespace

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`shared` | S |
`onUpdate` | (update: [SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md) & { shared: S  }) => void |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Disposable>
