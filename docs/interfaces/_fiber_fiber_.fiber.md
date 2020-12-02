**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Fiber/Fiber"](../modules/_fiber_fiber_.md) / Fiber

# Interface: Fiber\<A>

A Fiber is a lightweight process which can be used similarly to promises within the context of Effects.
Guaranteed to be asynchronously executed.

## Type parameters

Name |
------ |
`A` |

## Hierarchy

* [LazyDisposable](_disposable_exports_.lazydisposable.md)

  ↳ **Fiber**

## Index

### Properties

* [addChildFiber](_fiber_fiber_.fiber.md#addchildfiber)
* [addDisposable](_fiber_fiber_.fiber.md#adddisposable)
* [children](_fiber_fiber_.fiber.md#children)
* [disposed](_fiber_fiber_.fiber.md#disposed)
* [getInfo](_fiber_fiber_.fiber.md#getinfo)
* [onInfoChange](_fiber_fiber_.fiber.md#oninfochange)
* [parentFiber](_fiber_fiber_.fiber.md#parentfiber)
* [pauseChildFiber](_fiber_fiber_.fiber.md#pausechildfiber)
* [runChildFiber](_fiber_fiber_.fiber.md#runchildfiber)
* [setPaused](_fiber_fiber_.fiber.md#setpaused)

### Methods

* [dispose](_fiber_fiber_.fiber.md#dispose)

## Properties

### addChildFiber

• `Readonly` **addChildFiber**: (fiber: [Fiber](_fiber_fiber_.fiber.md)\<unknown>) => Disposable

*Defined in [src/Fiber/Fiber.ts:20](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L20)*

___

### addDisposable

• `Readonly` **addDisposable**: (d: Disposable) => Disposable

*Inherited from [LazyDisposable](_disposable_exports_.lazydisposable.md).[addDisposable](_disposable_exports_.lazydisposable.md#adddisposable)*

*Defined in [src/Disposable/exports.ts:14](https://github.com/TylorS/typed-fp/blob/f129829/src/Disposable/exports.ts#L14)*

___

### children

• `Readonly` **children**: ReadonlySet\<[Fiber](_fiber_fiber_.fiber.md)\<unknown>>

*Defined in [src/Fiber/Fiber.ts:16](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L16)*

___

### disposed

• `Readonly` **disposed**: boolean

*Inherited from [LazyDisposable](_disposable_exports_.lazydisposable.md).[disposed](_disposable_exports_.lazydisposable.md#disposed)*

*Defined in [src/Disposable/exports.ts:13](https://github.com/TylorS/typed-fp/blob/f129829/src/Disposable/exports.ts#L13)*

___

### getInfo

• `Readonly` **getInfo**: IO\<[FiberInfo](../modules/_fiber_fiber_.md#fiberinfo)\<A>>

*Defined in [src/Fiber/Fiber.ts:13](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L13)*

___

### onInfoChange

• `Readonly` **onInfoChange**: (f: (info: [FiberInfo](../modules/_fiber_fiber_.md#fiberinfo)\<A>) => Disposable) => Disposable

*Defined in [src/Fiber/Fiber.ts:18](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L18)*

___

### parentFiber

• `Readonly` **parentFiber**: Option\<[Fiber](_fiber_fiber_.fiber.md)\<unknown>>

*Defined in [src/Fiber/Fiber.ts:15](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L15)*

___

### pauseChildFiber

• `Readonly` **pauseChildFiber**: (fiber: [Fiber](_fiber_fiber_.fiber.md)\<unknown>, resume: IO\<Disposable>) => Disposable

*Defined in [src/Fiber/Fiber.ts:23](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L23)*

___

### runChildFiber

• `Readonly` **runChildFiber**: (fiber: [Fiber](_fiber_fiber_.fiber.md)\<unknown>, resume: IO\<Disposable>) => Disposable

*Defined in [src/Fiber/Fiber.ts:24](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L24)*

___

### setPaused

• `Readonly` **setPaused**: (paused: boolean) => void

*Defined in [src/Fiber/Fiber.ts:25](https://github.com/TylorS/typed-fp/blob/f129829/src/Fiber/Fiber.ts#L25)*

## Methods

### dispose

▸ **dispose**(): void

*Inherited from [LazyDisposable](_disposable_exports_.lazydisposable.md).[dispose](_disposable_exports_.lazydisposable.md#dispose)*

*Defined in node_modules/@most/types/index.d.ts:27*

**Returns:** void
