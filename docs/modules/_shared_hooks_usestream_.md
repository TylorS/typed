**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useStream"

# Module: "Shared/hooks/useStream"

## Index

### Functions

* [useStream](_shared_hooks_usestream_.md#usestream)

## Functions

### useStream

▸ **useStream**\<A>(`stream`: Stream\<A>, `onValue`: (value: A) => void): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Disposable>

*Defined in [src/Shared/hooks/useStream.ts:12](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/hooks/useStream.ts#L12)*

Subscribe to the events contained within a Stream.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`stream` | Stream\<A> |
`onValue` | (value: A) => void |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Disposable>
