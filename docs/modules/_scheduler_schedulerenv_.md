**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Scheduler/SchedulerEnv"

# Module: "Scheduler/SchedulerEnv"

## Index

### Interfaces

* [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md)

### Variables

* [provideSchedulerEnv](_scheduler_schedulerenv_.md#provideschedulerenv)

### Functions

* [asyncIO](_scheduler_schedulerenv_.md#asyncio)
* [delay](_scheduler_schedulerenv_.md#delay)

## Variables

### provideSchedulerEnv

• `Const` **provideSchedulerEnv**: [Provider](_effect_provide_.md#provider)\<[SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md)> = provideWith( Pure.fromIO( (): SchedulerEnv => ({ scheduler: newDefaultScheduler(), }), ),)

*Defined in [src/Scheduler/SchedulerEnv.ts:20](https://github.com/TylorS/typed-fp/blob/41076ce/src/Scheduler/SchedulerEnv.ts#L20)*

Provide an Effect with a SchedulerEnv

## Functions

### asyncIO

▸ `Const`**asyncIO**\<A>(`io`: IO\<A>): [Effect](_effect_effect_.effect.md)\<[SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), A>

*Defined in [src/Scheduler/SchedulerEnv.ts:45](https://github.com/TylorS/typed-fp/blob/41076ce/src/Scheduler/SchedulerEnv.ts#L45)*

Run an IO asynchronously

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`io` | IO\<A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), A>

___

### delay

▸ `Const`**delay**(`delay`: Time): [Effect](_effect_effect_.effect.md)\<[SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Time>

*Defined in [src/Scheduler/SchedulerEnv.ts:31](https://github.com/TylorS/typed-fp/blob/41076ce/src/Scheduler/SchedulerEnv.ts#L31)*

Add a delay at the specified about of time

#### Parameters:

Name | Type |
------ | ------ |
`delay` | Time |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), Time>
