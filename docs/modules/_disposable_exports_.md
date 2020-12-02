**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Disposable/exports"

# Module: "Disposable/exports"

## Index

### References

* [Disposable](_disposable_exports_.md#disposable)
* [DisposeAllError](_disposable_exports_.md#disposeallerror)
* [DisposeWith](_disposable_exports_.md#disposewith)
* [dispose](_disposable_exports_.md#dispose)
* [disposeAll](_disposable_exports_.md#disposeall)
* [disposeBoth](_disposable_exports_.md#disposeboth)
* [disposeNone](_disposable_exports_.md#disposenone)
* [disposeOnce](_disposable_exports_.md#disposeonce)
* [disposeWith](_disposable_exports_.md#disposewith)
* [isDisposeNone](_disposable_exports_.md#isdisposenone)
* [tryDispose](_disposable_exports_.md#trydispose)

### Interfaces

* [LazyDisposable](../interfaces/_disposable_exports_.lazydisposable.md)

### Functions

* [lazy](_disposable_exports_.md#lazy)
* [undisposable](_disposable_exports_.md#undisposable)

## References

### Disposable

Re-exports: Disposable

___

### DisposeAllError

Re-exports: DisposeAllError

___

### DisposeWith

Re-exports: DisposeWith

___

### dispose

Re-exports: dispose

___

### disposeAll

Re-exports: disposeAll

___

### disposeBoth

Re-exports: disposeBoth

___

### disposeNone

Re-exports: disposeNone

___

### disposeOnce

Re-exports: disposeOnce

___

### disposeWith

Re-exports: disposeWith

___

### isDisposeNone

Re-exports: isDisposeNone

___

### tryDispose

Re-exports: tryDispose

## Functions

### lazy

▸ `Const`**lazy**\<A>(`additional?`: A): [LazyDisposable](../interfaces/_disposable_exports_.lazydisposable.md) & A

*Defined in [src/Disposable/exports.ts:22](https://github.com/TylorS/typed-fp/blob/f129829/src/Disposable/exports.ts#L22)*

Create a LazyDisposable instance that can only be dispose of one time.
When attempting to add a Disposable after the LazyDisposable has been disposed it will be
disposed of synchronously.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`A` | object | {} |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`additional` | A | {} as A |

**Returns:** [LazyDisposable](../interfaces/_disposable_exports_.lazydisposable.md) & A

___

### undisposable

▸ `Const`**undisposable**\<A>(`f`: (...values: A) => void): (Anonymous function)

*Defined in [src/Disposable/exports.ts:73](https://github.com/TylorS/typed-fp/blob/f129829/src/Disposable/exports.ts#L73)*

Convert a void returning function into a Disposable returning function.

#### Type parameters:

Name | Type |
------ | ------ |
`A` | ReadonlyArray\<any> |

#### Parameters:

Name | Type |
------ | ------ |
`f` | (...values: A) => void |

**Returns:** (Anonymous function)
