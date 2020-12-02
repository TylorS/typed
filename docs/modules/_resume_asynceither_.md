**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Resume/AsyncEither"

# Module: "Resume/AsyncEither"

## Index

### Interfaces

* [AsyncEither](../interfaces/_resume_asynceither_.asynceither.md)

### Functions

* [asyncEither](_resume_asynceither_.md#asynceither)

## Functions

### asyncEither

▸ `Const`**asyncEither**\<A, B>(`run`: (left: (value: A) => Disposable, right: (value: B) => Disposable) => Disposable): [AsyncEither](../interfaces/_resume_asynceither_.asynceither.md)\<A, B>

*Defined in [src/Resume/AsyncEither.ts:15](https://github.com/TylorS/typed-fp/blob/f129829/src/Resume/AsyncEither.ts#L15)*

Resume an effect asynchronously that can possibly fail.

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`run` | (left: (value: A) => Disposable, right: (value: B) => Disposable) => Disposable |

**Returns:** [AsyncEither](../interfaces/_resume_asynceither_.asynceither.md)\<A, B>
