**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Fiber/Fiber"

# Module: "Fiber/Fiber"

## Index

### Enumerations

* [FiberState](../enums/_fiber_fiber_.fiberstate.md)

### Interfaces

* [Fiber](../interfaces/_fiber_fiber_.fiber.md)

### Type aliases

* [FiberComplete](_fiber_fiber_.md#fibercomplete)
* [FiberEventFromState](_fiber_fiber_.md#fibereventfromstate)
* [FiberFailed](_fiber_fiber_.md#fiberfailed)
* [FiberInfo](_fiber_fiber_.md#fiberinfo)
* [FiberPaused](_fiber_fiber_.md#fiberpaused)
* [FiberQueued](_fiber_fiber_.md#fiberqueued)
* [FiberRunning](_fiber_fiber_.md#fiberrunning)
* [FiberSuccess](_fiber_fiber_.md#fibersuccess)

### Variables

* [awaitCompleted](_fiber_fiber_.md#awaitcompleted)
* [awaitFailed](_fiber_fiber_.md#awaitfailed)
* [awaitPaused](_fiber_fiber_.md#awaitpaused)
* [awaitRunning](_fiber_fiber_.md#awaitrunning)
* [awaitSuccess](_fiber_fiber_.md#awaitsuccess)

### Functions

* [foldFiberInfo](_fiber_fiber_.md#foldfiberinfo)
* [listenFor](_fiber_fiber_.md#listenfor)

## Type aliases

### FiberComplete

Ƭ  **FiberComplete**\<A>: { state: [Completed](../enums/_fiber_fiber_.fiberstate.md#completed) ; value: A  }

*Defined in [src/Fiber/Fiber.ts:85](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L85)*

Parent fiber has a return value, and all forked fibers have completed.

#### Type parameters:

Name |
------ |
`A` |

#### Type declaration:

Name | Type |
------ | ------ |
`state` | [Completed](../enums/_fiber_fiber_.fiberstate.md#completed) |
`value` | A |

___

### FiberEventFromState

Ƭ  **FiberEventFromState**\<A, B>: A *extends* Queued ? FiberQueued : A *extends* Paused ? FiberPaused : A *extends* Running ? FiberRunning : A *extends* Failed ? FiberFailed : A *extends* Success ? FiberSuccess\<B> : A *extends* Completed ? FiberComplete\<B> : never

*Defined in [src/Fiber/Fiber.ts:131](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L131)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [FiberState](../enums/_fiber_fiber_.fiberstate.md) |
`B` | - |

___

### FiberFailed

Ƭ  **FiberFailed**: { error: Error ; state: [Failed](../enums/_fiber_fiber_.fiberstate.md#failed)  }

*Defined in [src/Fiber/Fiber.ts:69](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L69)*

Executing a fiber process threw and exception

#### Type declaration:

Name | Type |
------ | ------ |
`error` | Error |
`state` | [Failed](../enums/_fiber_fiber_.fiberstate.md#failed) |

___

### FiberInfo

Ƭ  **FiberInfo**\<A>: [FiberQueued](_fiber_fiber_.md#fiberqueued) \| [FiberPaused](_fiber_fiber_.md#fiberpaused) \| [FiberRunning](_fiber_fiber_.md#fiberrunning) \| [FiberFailed](_fiber_fiber_.md#fiberfailed) \| [FiberSuccess](_fiber_fiber_.md#fibersuccess)\<A> \| [FiberComplete](_fiber_fiber_.md#fibercomplete)\<A>

*Defined in [src/Fiber/Fiber.ts:37](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L37)*

#### Type parameters:

Name |
------ |
`A` |

___

### FiberPaused

Ƭ  **FiberPaused**: { state: [Paused](../enums/_fiber_fiber_.fiberstate.md#paused)  }

*Defined in [src/Fiber/Fiber.ts:55](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L55)*

Paused state for a fiber

#### Type declaration:

Name | Type |
------ | ------ |
`state` | [Paused](../enums/_fiber_fiber_.fiberstate.md#paused) |

___

### FiberQueued

Ƭ  **FiberQueued**: { state: [Queued](../enums/_fiber_fiber_.fiberstate.md#queued)  }

*Defined in [src/Fiber/Fiber.ts:48](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L48)*

Starting state for a fiber

#### Type declaration:

Name | Type |
------ | ------ |
`state` | [Queued](../enums/_fiber_fiber_.fiberstate.md#queued) |

___

### FiberRunning

Ƭ  **FiberRunning**: { state: [Running](../enums/_fiber_fiber_.fiberstate.md#running)  }

*Defined in [src/Fiber/Fiber.ts:62](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L62)*

Fiber has begun executing

#### Type declaration:

Name | Type |
------ | ------ |
`state` | [Running](../enums/_fiber_fiber_.fiberstate.md#running) |

___

### FiberSuccess

Ƭ  **FiberSuccess**\<A>: { state: [Success](../enums/_fiber_fiber_.fiberstate.md#success) ; value: A  }

*Defined in [src/Fiber/Fiber.ts:77](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L77)*

Parent fiber has a return value, but has forked fibers still running.

#### Type parameters:

Name |
------ |
`A` |

#### Type declaration:

Name | Type |
------ | ------ |
`state` | [Success](../enums/_fiber_fiber_.fiberstate.md#success) |
`value` | A |

## Variables

### awaitCompleted

• `Const` **awaitCompleted**: (Anonymous function) = listenFor(FiberState.Completed)

*Defined in [src/Fiber/Fiber.ts:129](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L129)*

___

### awaitFailed

• `Const` **awaitFailed**: (Anonymous function) = listenFor(FiberState.Failed)

*Defined in [src/Fiber/Fiber.ts:127](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L127)*

___

### awaitPaused

• `Const` **awaitPaused**: (Anonymous function) = listenFor(FiberState.Paused)

*Defined in [src/Fiber/Fiber.ts:125](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L125)*

___

### awaitRunning

• `Const` **awaitRunning**: (Anonymous function) = listenFor(FiberState.Running)

*Defined in [src/Fiber/Fiber.ts:126](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L126)*

___

### awaitSuccess

• `Const` **awaitSuccess**: (Anonymous function) = listenFor(FiberState.Success)

*Defined in [src/Fiber/Fiber.ts:128](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L128)*

## Functions

### foldFiberInfo

▸ `Const`**foldFiberInfo**\<A, B, C, D, E, F, G>(`queued`: () => A, `paused`: () => B, `running`: () => C, `failed`: (error: Error) => D, `success`: (value: E) => F, `completed`: (value: E) => G): (Anonymous function)

*Defined in [src/Fiber/Fiber.ts:90](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L90)*

#### Type parameters:

Name |
------ |
`A` |
`B` |
`C` |
`D` |
`E` |
`F` |
`G` |

#### Parameters:

Name | Type |
------ | ------ |
`queued` | () => A |
`paused` | () => B |
`running` | () => C |
`failed` | (error: Error) => D |
`success` | (value: E) => F |
`completed` | (value: E) => G |

**Returns:** (Anonymous function)

___

### listenFor

▸ `Const`**listenFor**\<A>(`state`: A): (Anonymous function)

*Defined in [src/Fiber/Fiber.ts:114](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L114)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [FiberState](../enums/_fiber_fiber_.fiberstate.md) |

#### Parameters:

Name | Type |
------ | ------ |
`state` | A |

**Returns:** (Anonymous function)
