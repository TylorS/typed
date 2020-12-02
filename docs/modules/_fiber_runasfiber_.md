**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Fiber/runAsFiber"

# Module: "Fiber/runAsFiber"

## Index

### Functions

* [fiberToPromise](_fiber_runasfiber_.md#fibertopromise)
* [runAsFiber](_fiber_runasfiber_.md#runasfiber)
* [runAsFiberWith](_fiber_runasfiber_.md#runasfiberwith)

## Functions

### fiberToPromise

▸ `Const`**fiberToPromise**\<A>(`fiber`: [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>): Promise\<A>

*Defined in [src/Fiber/runAsFiber.ts:26](https://github.com/TylorS/typed-fp/blob/41076ce/src/Fiber/runAsFiber.ts#L26)*

Convert a fiber to a Promise of it's success/completion value.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`fiber` | [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A> |

**Returns:** Promise\<A>

___

### runAsFiber

▸ `Const`**runAsFiber**\<A>(`effect`: [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), A>, `scheduler`: Scheduler): [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>

*Defined in [src/Fiber/runAsFiber.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/Fiber/runAsFiber.ts#L14)*

Intended for running an application using fibers. Should not be used to create individual fibers, instead
use `fork`.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), A> |
`scheduler` | Scheduler |

**Returns:** [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>

___

### runAsFiberWith

▸ `Const`**runAsFiberWith**(`scheduler`: Scheduler): (Anonymous function)

*Defined in [src/Fiber/runAsFiber.ts:20](https://github.com/TylorS/typed-fp/blob/41076ce/src/Fiber/runAsFiber.ts#L20)*

A curried variant of runAsFiber to be used with pipe()

#### Parameters:

Name | Type |
------ | ------ |
`scheduler` | Scheduler |

**Returns:** (Anonymous function)
