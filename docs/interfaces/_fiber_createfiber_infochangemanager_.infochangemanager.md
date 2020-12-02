**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Fiber/createFiber/InfoChangeManager"](../modules/_fiber_createfiber_infochangemanager_.md) / InfoChangeManager

# Interface: InfoChangeManager\<A>

## Type parameters

Name |
------ |
`A` |

## Hierarchy

* Disposable

  ↳ **InfoChangeManager**

## Index

### Properties

* [getInfo](_fiber_createfiber_infochangemanager_.infochangemanager.md#getinfo)
* [onInfoChange](_fiber_createfiber_infochangemanager_.infochangemanager.md#oninfochange)
* [setPaused](_fiber_createfiber_infochangemanager_.infochangemanager.md#setpaused)
* [updateInfo](_fiber_createfiber_infochangemanager_.infochangemanager.md#updateinfo)

### Methods

* [dispose](_fiber_createfiber_infochangemanager_.infochangemanager.md#dispose)

## Properties

### getInfo

• `Readonly` **getInfo**: IO\<[FiberInfo](../modules/_fiber_fiber_.md#fiberinfo)\<A>>

*Defined in [src/Fiber/createFiber/InfoChangeManager.ts:11](https://github.com/TylorS/typed-fp/blob/559f273/src/Fiber/createFiber/InfoChangeManager.ts#L11)*

___

### onInfoChange

• `Readonly` **onInfoChange**: (f: (info: [FiberInfo](../modules/_fiber_fiber_.md#fiberinfo)\<A>) => Disposable) => Disposable

*Defined in [src/Fiber/createFiber/InfoChangeManager.ts:13](https://github.com/TylorS/typed-fp/blob/559f273/src/Fiber/createFiber/InfoChangeManager.ts#L13)*

___

### setPaused

• `Readonly` **setPaused**: (paused: boolean) => void

*Defined in [src/Fiber/createFiber/InfoChangeManager.ts:14](https://github.com/TylorS/typed-fp/blob/559f273/src/Fiber/createFiber/InfoChangeManager.ts#L14)*

___

### updateInfo

• `Readonly` **updateInfo**: (updated: [FiberInfo](../modules/_fiber_fiber_.md#fiberinfo)\<A>) => void

*Defined in [src/Fiber/createFiber/InfoChangeManager.ts:12](https://github.com/TylorS/typed-fp/blob/559f273/src/Fiber/createFiber/InfoChangeManager.ts#L12)*

## Methods

### dispose

▸ **dispose**(): void

*Inherited from [LazyDisposable](_disposable_exports_.lazydisposable.md).[dispose](_disposable_exports_.lazydisposable.md#dispose)*

*Defined in node_modules/@most/types/index.d.ts:27*

**Returns:** void
