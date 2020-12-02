**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/memoNamespace/withMemo"

# Module: "Shared/memoNamespace/withMemo"

## Index

### Functions

* [withMemo](_shared_memonamespace_withmemo_.md#withmemo)

## Functions

### withMemo

▸ `Const`**withMemo**\<E, A>(`effect`: [Effect](_effect_effect_.effect.md)\<E, A>): [Effect](_effect_effect_.effect.md)\<E & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), A>

*Defined in [src/Shared/memoNamespace/withMemo.ts:10](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/memoNamespace/withMemo.ts#L10)*

Memoize an Effect with the current namespace.

#### Type parameters:

Name | Type |
------ | ------ |
`E` | [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) |
`A` | - |

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), A>
