**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Scheduler/createCallbackTask"

# Module: "Scheduler/createCallbackTask"

## Index

### Functions

* [createCallbackTask](_scheduler_createcallbacktask_.md#createcallbacktask)

## Functions

### createCallbackTask

▸ **createCallbackTask**(`cb`: IO\<Disposable>, `onError?`: undefined \| (error: Error) => void): Task

*Defined in [src/Scheduler/createCallbackTask.ts:8](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Scheduler/createCallbackTask.ts#L8)*

Convert an IO<Disposable> into a Most.js Task

#### Parameters:

Name | Type |
------ | ------ |
`cb` | IO\<Disposable> |
`onError?` | undefined \| (error: Error) => void |

**Returns:** Task
