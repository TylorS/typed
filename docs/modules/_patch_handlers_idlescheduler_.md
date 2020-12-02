**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/handlers/IdleScheduler"

# Module: "Patch/handlers/IdleScheduler"

## Index

### Type aliases

* [IdleScheduler](_patch_handlers_idlescheduler_.md#idlescheduler)

### Functions

* [createIdleScheduler](_patch_handlers_idlescheduler_.md#createidlescheduler)

## Type aliases

### IdleScheduler

Ƭ  **IdleScheduler**: ReturnType\<*typeof* [createIdleScheduler](_patch_handlers_idlescheduler_.md#createidlescheduler)>

*Defined in [src/Patch/handlers/IdleScheduler.ts:6](https://github.com/TylorS/typed-fp/blob/41076ce/src/Patch/handlers/IdleScheduler.ts#L6)*

## Functions

### createIdleScheduler

▸ **createIdleScheduler**\<E, A>(`queue`: [Queue](../interfaces/_queue_queue_.queue.md)\<A>, `f`: (value: A) => [Effect](_effect_effect_.effect.md)\<E, void>): object

*Defined in [src/Patch/handlers/IdleScheduler.ts:8](https://github.com/TylorS/typed-fp/blob/41076ce/src/Patch/handlers/IdleScheduler.ts#L8)*

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`queue` | [Queue](../interfaces/_queue_queue_.queue.md)\<A> |
`f` | (value: A) => [Effect](_effect_effect_.effect.md)\<E, void> |

**Returns:** object

Name | Type |
------ | ------ |
`scheduleNextRun` | scheduleNextRun |
`scheduled` |  |
