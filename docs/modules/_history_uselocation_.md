**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "history/useLocation"

# Module: "history/useLocation"

## Index

### Variables

* [CurrentLocation](_history_uselocation_.md#currentlocation)
* [getLocation](_history_uselocation_.md#getlocation)

### Functions

* [useLocation](_history_uselocation_.md#uselocation)

## Variables

### CurrentLocation

• `Const` **CurrentLocation**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<\"location\">, Record\<\"location\", Location>, Location> = fromKey\<Location>()('location')

*Defined in [src/history/useLocation.ts:20](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/history/useLocation.ts#L20)*

A Shared instance of the current Location

___

### getLocation

• `Const` **getLocation**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & Record\<\"location\", Location>, Location> = usingGlobal(getShared(CurrentLocation))

*Defined in [src/history/useLocation.ts:25](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/history/useLocation.ts#L25)*

Get the current Location.

## Functions

### useLocation

▸ `Const`**useLocation**(`target`: EventTarget): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [HistoryEnv](../interfaces/_history_historyenv_.historyenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Location>

*Defined in [src/history/useLocation.ts:31](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/history/useLocation.ts#L31)*

Listen to PopState events from a given EventTarget and return
the most up-to-date Location.

#### Parameters:

Name | Type |
------ | ------ |
`target` | EventTarget |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [HistoryEnv](../interfaces/_history_historyenv_.historyenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Location>
