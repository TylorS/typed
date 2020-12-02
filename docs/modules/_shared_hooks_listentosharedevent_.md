**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/listenToSharedEvent"

# Module: "Shared/hooks/listenToSharedEvent"

## Index

### Functions

* [listenToSharedEvent](_shared_hooks_listentosharedevent_.md#listentosharedevent)

## Functions

### listenToSharedEvent

▸ `Const`**listenToSharedEvent**\<A>(`guard`: Guard\<unknown, A>, `onEvent`: (value: A) => void): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Disposable>

*Defined in [src/Shared/hooks/listenToSharedEvent.ts:12](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/hooks/listenToSharedEvent.ts#L12)*

Listen to Shared events that match a Guard instance.

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [SharedEvent](_shared_core_events_sharedevent_.sharedevent.md) |

#### Parameters:

Name | Type |
------ | ------ |
`guard` | Guard\<unknown, A> |
`onEvent` | (value: A) => void |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Disposable>
