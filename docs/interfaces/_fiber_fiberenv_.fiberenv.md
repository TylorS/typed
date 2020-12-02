**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Fiber/FiberEnv"](../modules/_fiber_fiberenv_.md) / FiberEnv

# Interface: FiberEnv

An environment type for managing fibers and performing simple cooperative multitasking.

## Hierarchy

* [SchedulerEnv](_scheduler_schedulerenv_.schedulerenv.md)

  ↳ **FiberEnv**

## Index

### Properties

* [currentFiber](_fiber_fiberenv_.fiberenv.md#currentfiber)
* [fork](_fiber_fiberenv_.fiberenv.md#fork)
* [join](_fiber_fiberenv_.fiberenv.md#join)
* [kill](_fiber_fiberenv_.fiberenv.md#kill)
* [pause](_fiber_fiberenv_.fiberenv.md#pause)
* [proceed](_fiber_fiberenv_.fiberenv.md#proceed)
* [scheduler](_fiber_fiberenv_.fiberenv.md#scheduler)

## Properties

### currentFiber

• `Readonly` **currentFiber**: [Fiber](_fiber_fiber_.fiber.md)\<unknown>

*Defined in [src/Fiber/FiberEnv.ts:11](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Fiber/FiberEnv.ts#L11)*

___

### fork

• `Readonly` **fork**: \<E, A>(effect: [Effect](../modules/_effect_effect_.effect.md)\<E, A>, env: E & [FiberEnv](_fiber_fiberenv_.fiberenv.md)) => [Resume](../modules/_resume_resume_.md#resume)\<[Fiber](_fiber_fiber_.fiber.md)\<A>>

*Defined in [src/Fiber/FiberEnv.ts:12](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Fiber/FiberEnv.ts#L12)*

___

### join

• `Readonly` **join**: \<A>(fiber: [Fiber](_fiber_fiber_.fiber.md)\<A>) => [Resume](../modules/_resume_resume_.md#resume)\<Either\<Error, A>>

*Defined in [src/Fiber/FiberEnv.ts:13](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Fiber/FiberEnv.ts#L13)*

___

### kill

• `Readonly` **kill**: \<A>(fiber: [Fiber](_fiber_fiber_.fiber.md)\<A>) => [Resume](../modules/_resume_resume_.md#resume)\<void>

*Defined in [src/Fiber/FiberEnv.ts:14](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Fiber/FiberEnv.ts#L14)*

___

### pause

• `Readonly` **pause**: [Resume](../modules/_resume_resume_.md#resume)\<void>

*Defined in [src/Fiber/FiberEnv.ts:17](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Fiber/FiberEnv.ts#L17)*

___

### proceed

• `Readonly` **proceed**: (fiber: [Fiber](_fiber_fiber_.fiber.md)\<unknown>) => [Resume](../modules/_resume_resume_.md#resume)\<void>

*Defined in [src/Fiber/FiberEnv.ts:20](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Fiber/FiberEnv.ts#L20)*

___

### scheduler

• `Readonly` **scheduler**: Scheduler

*Inherited from [SchedulerEnv](_scheduler_schedulerenv_.schedulerenv.md).[scheduler](_scheduler_schedulerenv_.schedulerenv.md#scheduler)*

*Defined in [src/Scheduler/SchedulerEnv.ts:14](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Scheduler/SchedulerEnv.ts#L14)*
