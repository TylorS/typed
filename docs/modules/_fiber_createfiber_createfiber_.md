**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Fiber/createFiber/createFiber"

# Module: "Fiber/createFiber/createFiber"

## Index

### Functions

* [createFiber](_fiber_createfiber_createfiber_.md#createfiber)
* [createFiberEnv](_fiber_createfiber_createfiber_.md#createfiberenv)
* [createFiberWith](_fiber_createfiber_createfiber_.md#createfiberwith)
* [joinFiber](_fiber_createfiber_createfiber_.md#joinfiber)
* [killFiber](_fiber_createfiber_createfiber_.md#killfiber)

## Functions

### createFiber

▸ **createFiber**\<A>(`effect`: [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), A>, `scheduler`: Scheduler, `parentFiber?`: Option\<[Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>>): [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>

*Defined in [src/Fiber/createFiber/createFiber.ts:32](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Fiber/createFiber/createFiber.ts#L32)*

Create a Fiber instance for an Effect<FiberEnv, A> given a Scheduler and
its parent instance.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), A> | - |
`scheduler` | Scheduler | - |
`parentFiber` | Option\<[Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>> | none |

**Returns:** [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>

___

### createFiberEnv

▸ **createFiberEnv**(`currentFiber`: [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>, `scheduler`: Scheduler): [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md)

*Defined in [src/Fiber/createFiber/createFiber.ts:110](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Fiber/createFiber/createFiber.ts#L110)*

#### Parameters:

Name | Type |
------ | ------ |
`currentFiber` | [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown> |
`scheduler` | Scheduler |

**Returns:** [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md)

___

### createFiberWith

▸ **createFiberWith**(`scheduler`: Scheduler, `parentFiber`: Option\<[Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>>): (Anonymous function)

*Defined in [src/Fiber/createFiber/createFiber.ts:151](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Fiber/createFiber/createFiber.ts#L151)*

#### Parameters:

Name | Type |
------ | ------ |
`scheduler` | Scheduler |
`parentFiber` | Option\<[Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>> |

**Returns:** (Anonymous function)

___

### joinFiber

▸ **joinFiber**\<A>(`fiber`: [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>): [Resume](_resume_resume_.md#resume)\<Either\<Error, A>>

*Defined in [src/Fiber/createFiber/createFiber.ts:155](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Fiber/createFiber/createFiber.ts#L155)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`fiber` | [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A> |

**Returns:** [Resume](_resume_resume_.md#resume)\<Either\<Error, A>>

___

### killFiber

▸ **killFiber**\<A>(`fiber`: [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>): [Resume](_resume_resume_.md#resume)\<void>

*Defined in [src/Fiber/createFiber/createFiber.ts:170](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Fiber/createFiber/createFiber.ts#L170)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`fiber` | [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A> |

**Returns:** [Resume](_resume_resume_.md#resume)\<void>
