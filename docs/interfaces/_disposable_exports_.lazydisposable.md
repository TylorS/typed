**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Disposable/exports"](../modules/_disposable_exports_.md) / LazyDisposable

# Interface: LazyDisposable

A Disposable instance that is capable of imperatively adding additional
Disposable resources to it. This can be helpful for converting third-party APIs.

## Hierarchy

* Disposable

  ↳ **LazyDisposable**

  ↳↳ [Fiber](_fiber_fiber_.fiber.md)

## Index

### Properties

* [addDisposable](_disposable_exports_.lazydisposable.md#adddisposable)
* [disposed](_disposable_exports_.lazydisposable.md#disposed)

### Methods

* [dispose](_disposable_exports_.lazydisposable.md#dispose)

## Properties

### addDisposable

• `Readonly` **addDisposable**: (d: Disposable) => Disposable

*Defined in [src/Disposable/exports.ts:14](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Disposable/exports.ts#L14)*

___

### disposed

• `Readonly` **disposed**: boolean

*Defined in [src/Disposable/exports.ts:13](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Disposable/exports.ts#L13)*

## Methods

### dispose

▸ **dispose**(): void

*Inherited from [LazyDisposable](_disposable_exports_.lazydisposable.md).[dispose](_disposable_exports_.lazydisposable.md#dispose)*

*Defined in node_modules/@most/types/index.d.ts:27*

**Returns:** void
