**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Resume/Async"

# Module: "Resume/Async"

## Index

### Interfaces

* [Async](../interfaces/_resume_async_.async.md)

### Functions

* [async](_resume_async_.md#async)

## Functions

### async

▸ `Const`**async**\<A>(`run`: (resume: [Arity1](_common_types_.md#arity1)\<A, Disposable>) => Disposable): [Async](../interfaces/_resume_async_.async.md)\<A>

*Defined in [src/Resume/Async.ts:15](https://github.com/TylorS/typed-fp/blob/8639976/src/Resume/Async.ts#L15)*

Resume an effect asynchronously, can only be resumed one time.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`run` | (resume: [Arity1](_common_types_.md#arity1)\<A, Disposable>) => Disposable |

**Returns:** [Async](../interfaces/_resume_async_.async.md)\<A>
