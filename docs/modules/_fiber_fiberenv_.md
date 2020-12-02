**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Fiber/FiberEnv"

# Module: "Fiber/FiberEnv"

## Index

### Interfaces

* [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md)

### Variables

* [getCurrentFiber](_fiber_fiberenv_.md#getcurrentfiber)
* [getParentFiber](_fiber_fiberenv_.md#getparentfiber)
* [pause](_fiber_fiberenv_.md#pause)

### Functions

* [fork](_fiber_fiberenv_.md#fork)
* [forkPaused](_fiber_fiberenv_.md#forkpaused)
* [join](_fiber_fiberenv_.md#join)
* [kill](_fiber_fiberenv_.md#kill)
* [proceed](_fiber_fiberenv_.md#proceed)
* [proceedAll](_fiber_fiberenv_.md#proceedall)

## Variables

### getCurrentFiber

• `Const` **getCurrentFiber**: [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>> = fromEnv((e: FiberEnv) => sync(e.currentFiber))

*Defined in [src/Fiber/FiberEnv.ts:26](https://github.com/TylorS/typed-fp/blob/8639976/src/Fiber/FiberEnv.ts#L26)*

Get the current Fiber instance.

___

### getParentFiber

• `Const` **getParentFiber**: [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), Option\<[Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>>> = fromEnv((e: FiberEnv) => sync(e.currentFiber.parentFiber))

*Defined in [src/Fiber/FiberEnv.ts:31](https://github.com/TylorS/typed-fp/blob/8639976/src/Fiber/FiberEnv.ts#L31)*

Get the parent Fiber instance.

___

### pause

• `Const` **pause**: [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), void> = fromEnv((e) => e.pause)

*Defined in [src/Fiber/FiberEnv.ts:69](https://github.com/TylorS/typed-fp/blob/8639976/src/Fiber/FiberEnv.ts#L69)*

Pause the current fiber allowing for cooperative multitasking with a parent Fiber.

**`example`** 

const queue = []

const foo = forever(doEffect(function*(){
  const item = queue.shift()

  if (item) {
    // Do some work
  }

  // Allow for parent fiber to decide when to proceed
  yield* pause
}))

## Functions

### fork

▸ `Const`**fork**\<E, A>(`effect`: [Effect](_effect_effect_.effect.md)\<E, A>): [Effect](_effect_effect_.effect.md)\<E & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>>

*Defined in [src/Fiber/FiberEnv.ts:38](https://github.com/TylorS/typed-fp/blob/8639976/src/Fiber/FiberEnv.ts#L38)*

Creates a Fiber, a "child process" that is inherently tied to the fiber that it originates within.
When the parent is killed, the child process will also be killed.
When the parent has completed its own execution, if it still has running child processes, it will continue in a running state.

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>>

___

### forkPaused

▸ `Const`**forkPaused**\<E, A>(`effect`: [Effect](_effect_effect_.effect.md)\<E, A>): [Effect](_effect_effect_.effect.md)\<E & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>>

*Defined in [src/Fiber/FiberEnv.ts:89](https://github.com/TylorS/typed-fp/blob/8639976/src/Fiber/FiberEnv.ts#L89)*

Create a Fiber that will start in an immediately paused state to allow for the parent fiber
to decide when it starts doing any work.

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>>

___

### join

▸ `Const`**join**\<A>(`fiber`: [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>): [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), Either\<Error, A>>

*Defined in [src/Fiber/FiberEnv.ts:44](https://github.com/TylorS/typed-fp/blob/8639976/src/Fiber/FiberEnv.ts#L44)*

Rejoin a fiber with the current process

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`fiber` | [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), Either\<Error, A>>

___

### kill

▸ `Const`**kill**\<A>(`fiber`: [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A>): [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), void>

*Defined in [src/Fiber/FiberEnv.ts:50](https://github.com/TylorS/typed-fp/blob/8639976/src/Fiber/FiberEnv.ts#L50)*

Kill a fiber process

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`fiber` | [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), void>

___

### proceed

▸ `Const`**proceed**(`fiber`: [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>): [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), void>

*Defined in [src/Fiber/FiberEnv.ts:74](https://github.com/TylorS/typed-fp/blob/8639976/src/Fiber/FiberEnv.ts#L74)*

Allow for a paused Fiber to continue running.

#### Parameters:

Name | Type |
------ | ------ |
`fiber` | [Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), void>

___

### proceedAll

▸ `Const`**proceedAll**(...`fibers`: ReadonlyArray\<[Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>>): [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), void>

*Defined in [src/Fiber/FiberEnv.ts:80](https://github.com/TylorS/typed-fp/blob/8639976/src/Fiber/FiberEnv.ts#L80)*

Allow for many paused Fibers to continue running.

#### Parameters:

Name | Type |
------ | ------ |
`...fibers` | ReadonlyArray\<[Fiber](../interfaces/_fiber_fiber_.fiber.md)\<unknown>> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md), void>
