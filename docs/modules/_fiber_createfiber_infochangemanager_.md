**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Fiber/createFiber/InfoChangeManager"

# Module: "Fiber/createFiber/InfoChangeManager"

## Index

### Interfaces

* [InfoChangeManager](../interfaces/_fiber_createfiber_infochangemanager_.infochangemanager.md)

### Type aliases

* [InfoChangeSubscriber](_fiber_createfiber_infochangemanager_.md#infochangesubscriber)

### Functions

* [createInfoChangeManager](_fiber_createfiber_infochangemanager_.md#createinfochangemanager)

## Type aliases

### InfoChangeSubscriber

Ƭ  **InfoChangeSubscriber**\<A>: readonly [[Arity1](_common_types_.md#arity1)\<[FiberInfo](_fiber_fiber_.md#fiberinfo)\<A>, Disposable>, [LazyDisposable](../interfaces/_disposable_exports_.lazydisposable.md)]

*Defined in [src/Fiber/createFiber/InfoChangeManager.ts:114](https://github.com/TylorS/typed-fp/blob/559f273/src/Fiber/createFiber/InfoChangeManager.ts#L114)*

#### Type parameters:

Name |
------ |
`A` |

## Functions

### createInfoChangeManager

▸ **createInfoChangeManager**\<A>(`scheduler`: Scheduler): [InfoChangeManager](../interfaces/_fiber_createfiber_infochangemanager_.infochangemanager.md)\<A>

*Defined in [src/Fiber/createFiber/InfoChangeManager.ts:17](https://github.com/TylorS/typed-fp/blob/559f273/src/Fiber/createFiber/InfoChangeManager.ts#L17)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`scheduler` | Scheduler |

**Returns:** [InfoChangeManager](../interfaces/_fiber_createfiber_infochangemanager_.infochangemanager.md)\<A>
