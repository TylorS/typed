**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Fiber/createFiber/FiberManager"](../modules/_fiber_createfiber_fibermanager_.md) / FiberManager

# Interface: FiberManager

## Hierarchy

* Disposable

  ↳ **FiberManager**

## Index

### Properties

* [addFiber](_fiber_createfiber_fibermanager_.fibermanager.md#addfiber)
* [fibers](_fiber_createfiber_fibermanager_.fibermanager.md#fibers)
* [pauseFiber](_fiber_createfiber_fibermanager_.fibermanager.md#pausefiber)
* [runChildFiber](_fiber_createfiber_fibermanager_.fibermanager.md#runchildfiber)

### Methods

* [dispose](_fiber_createfiber_fibermanager_.fibermanager.md#dispose)

## Properties

### addFiber

• `Readonly` **addFiber**: (fiber: [Fiber](_fiber_fiber_.fiber.md)\<unknown>) => Disposable

*Defined in [src/Fiber/createFiber/FiberManager.ts:8](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Fiber/createFiber/FiberManager.ts#L8)*

___

### fibers

• `Readonly` **fibers**: ReadonlySet\<[Fiber](_fiber_fiber_.fiber.md)\<unknown>>

*Defined in [src/Fiber/createFiber/FiberManager.ts:7](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Fiber/createFiber/FiberManager.ts#L7)*

___

### pauseFiber

• `Readonly` **pauseFiber**: (fiber: [Fiber](_fiber_fiber_.fiber.md)\<unknown>, resume: IO\<Disposable>) => Disposable

*Defined in [src/Fiber/createFiber/FiberManager.ts:9](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Fiber/createFiber/FiberManager.ts#L9)*

___

### runChildFiber

• `Readonly` **runChildFiber**: (fiber: [Fiber](_fiber_fiber_.fiber.md)\<unknown>, resume: IO\<Disposable>) => Disposable

*Defined in [src/Fiber/createFiber/FiberManager.ts:10](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Fiber/createFiber/FiberManager.ts#L10)*

## Methods

### dispose

▸ **dispose**(): void

*Inherited from [LazyDisposable](_disposable_exports_.lazydisposable.md).[dispose](_disposable_exports_.lazydisposable.md#dispose)*

*Defined in node_modules/@most/types/index.d.ts:27*

**Returns:** void
