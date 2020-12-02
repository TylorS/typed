**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Scheduler/VirtualTimer/Timeline"](../modules/_scheduler_virtualtimer_timeline_.md) / Timeline

# Class: Timeline

Timeline is responsible for storing tasks at a given time and
returns what tasks are ready at the current time.

## Hierarchy

* **Timeline**

## Index

### Properties

* [tasks](_scheduler_virtualtimer_timeline_.timeline.md#tasks)

### Methods

* [addTask](_scheduler_virtualtimer_timeline_.timeline.md#addtask)
* [getAndDelete](_scheduler_virtualtimer_timeline_.timeline.md#getanddelete)
* [readyTasks](_scheduler_virtualtimer_timeline_.timeline.md#readytasks)
* [removeTask](_scheduler_virtualtimer_timeline_.timeline.md#removetask)

## Properties

### tasks

• `Private` **tasks**: [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<number, [Arity1](../modules/_common_types_.md#arity1)\<number>[]> = new Map()

*Defined in [src/Scheduler/VirtualTimer/Timeline.ts:12](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Scheduler/VirtualTimer/Timeline.ts#L12)*

## Methods

### addTask

▸ **addTask**(`time`: number, `f`: [Arity1](../modules/_common_types_.md#arity1)\<number>): void

*Defined in [src/Scheduler/VirtualTimer/Timeline.ts:14](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Scheduler/VirtualTimer/Timeline.ts#L14)*

#### Parameters:

Name | Type |
------ | ------ |
`time` | number |
`f` | [Arity1](../modules/_common_types_.md#arity1)\<number> |

**Returns:** void

___

### getAndDelete

▸ `Private`**getAndDelete**(`time`: number): [Arity1](../modules/_common_types_.md#arity1)\<number, any>[]

*Defined in [src/Scheduler/VirtualTimer/Timeline.ts:47](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Scheduler/VirtualTimer/Timeline.ts#L47)*

#### Parameters:

Name | Type |
------ | ------ |
`time` | number |

**Returns:** [Arity1](../modules/_common_types_.md#arity1)\<number, any>[]

___

### readyTasks

▸ **readyTasks**(`currentTime`: number): [Arity1](../modules/_common_types_.md#arity1)\<number, any>[]

*Defined in [src/Scheduler/VirtualTimer/Timeline.ts:40](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Scheduler/VirtualTimer/Timeline.ts#L40)*

#### Parameters:

Name | Type |
------ | ------ |
`currentTime` | number |

**Returns:** [Arity1](../modules/_common_types_.md#arity1)\<number, any>[]

___

### removeTask

▸ **removeTask**(`time`: number, `f`: [Arity1](../modules/_common_types_.md#arity1)\<number>): void

*Defined in [src/Scheduler/VirtualTimer/Timeline.ts:22](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Scheduler/VirtualTimer/Timeline.ts#L22)*

#### Parameters:

Name | Type |
------ | ------ |
`time` | number |
`f` | [Arity1](../modules/_common_types_.md#arity1)\<number> |

**Returns:** void
