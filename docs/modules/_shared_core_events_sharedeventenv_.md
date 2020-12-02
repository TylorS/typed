**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/events/SharedEventEnv"

# Module: "Shared/core/events/SharedEventEnv"

## Index

### Interfaces

* [SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md)

### Variables

* [getSendSharedEvent](_shared_core_events_sharedeventenv_.md#getsendsharedevent)
* [getSharedEvents](_shared_core_events_sharedeventenv_.md#getsharedevents)

### Functions

* [sendSharedEvent](_shared_core_events_sharedeventenv_.md#sendsharedevent)

## Variables

### getSendSharedEvent

• `Const` **getSendSharedEvent**: [Effect](_effect_effect_.effect.md)\<[SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md), (event: [SharedEvent](_shared_core_events_sharedevent_.sharedevent.md)) => void> = asks( (e: SharedEventEnv) => e.sharedEvents[0],)

*Defined in [src/Shared/core/events/SharedEventEnv.ts:13](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/core/events/SharedEventEnv.ts#L13)*

___

### getSharedEvents

• `Const` **getSharedEvents**: [Effect](_effect_effect_.effect.md)\<[SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md), Stream\<[SharedEvent](_shared_core_events_sharedevent_.sharedevent.md)>> = asks( (e: SharedEventEnv) => e.sharedEvents[1],)

*Defined in [src/Shared/core/events/SharedEventEnv.ts:9](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/core/events/SharedEventEnv.ts#L9)*

## Functions

### sendSharedEvent

▸ `Const`**sendSharedEvent**(`event`: [SharedEvent](_shared_core_events_sharedevent_.sharedevent.md)): [Effect](_effect_effect_.effect.md)\<[SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md), void>

*Defined in [src/Shared/core/events/SharedEventEnv.ts:17](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/core/events/SharedEventEnv.ts#L17)*

#### Parameters:

Name | Type |
------ | ------ |
`event` | [SharedEvent](_shared_core_events_sharedevent_.sharedevent.md) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEventEnv](../interfaces/_shared_core_events_sharedeventenv_.sharedeventenv.md), void>
