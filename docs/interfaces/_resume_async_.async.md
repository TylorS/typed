**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Resume/Async"](../modules/_resume_async_.md) / Async

# Interface: Async\<A>

An cancelable asynchronous effect

## Type parameters

Name |
------ |
`A` |

## Hierarchy

* **Async**

  ↳ [AsyncEither](_resume_asynceither_.asynceither.md)

## Index

### Properties

* [async](_resume_async_.async.md#async)
* [run](_resume_async_.async.md#run)

## Properties

### async

• `Readonly` **async**: true

*Defined in [src/Resume/Async.ts:8](https://github.com/TylorS/typed-fp/blob/8639976/src/Resume/Async.ts#L8)*

___

### run

• `Readonly` **run**: (resume: [Arity1](../modules/_common_types_.md#arity1)\<A, Disposable>) => Disposable

*Defined in [src/Resume/Async.ts:9](https://github.com/TylorS/typed-fp/blob/8639976/src/Resume/Async.ts#L9)*
