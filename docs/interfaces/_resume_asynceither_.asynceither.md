**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Resume/AsyncEither"](../modules/_resume_asynceither_.md) / AsyncEither

# Interface: AsyncEither\<A, B>

An Async effect that might fail.

## Type parameters

Name |
------ |
`A` |
`B` |

## Hierarchy

* [Async](_resume_async_.async.md)\<Either\<A, B>>

  ↳ **AsyncEither**

## Index

### Properties

* [async](_resume_asynceither_.asynceither.md#async)
* [run](_resume_asynceither_.asynceither.md#run)

## Properties

### async

• `Readonly` **async**: true

*Inherited from [Async](_resume_async_.async.md).[async](_resume_async_.async.md#async)*

*Defined in [src/Resume/Async.ts:8](https://github.com/TylorS/typed-fp/blob/559f273/src/Resume/Async.ts#L8)*

___

### run

• `Readonly` **run**: (resume: [Arity1](../modules/_common_types_.md#arity1)\<Either\<A, B>, Disposable>) => Disposable

*Inherited from [Async](_resume_async_.async.md).[run](_resume_async_.async.md#run)*

*Defined in [src/Resume/Async.ts:9](https://github.com/TylorS/typed-fp/blob/559f273/src/Resume/Async.ts#L9)*
