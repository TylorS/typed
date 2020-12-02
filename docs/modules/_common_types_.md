**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/types"

# Module: "common/types"

## Index

### Type aliases

* [ArgsOf](_common_types_.md#argsof)
* [Arity1](_common_types_.md#arity1)
* [Arity2](_common_types_.md#arity2)
* [Arity3](_common_types_.md#arity3)
* [Arity4](_common_types_.md#arity4)
* [Arity5](_common_types_.md#arity5)
* [Equals](_common_types_.md#equals)
* [HeadArg](_common_types_.md#headarg)
* [IsNever](_common_types_.md#isnever)
* [IsUnknown](_common_types_.md#isunknown)
* [NoInfer](_common_types_.md#noinfer)

## Type aliases

### ArgsOf

Ƭ  **ArgsOf**\<A>: A *extends* (...args: *infer* R) => any ? R : never

*Defined in [src/common/types.ts:4](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L4)*

Extract the Arguments from a Function type.

#### Type parameters:

Name |
------ |
`A` |

___

### Arity1

Ƭ  **Arity1**\<A, B>: (value: A) => B

*Defined in [src/common/types.ts:14](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L14)*

A type-level helper for functions with an arity of 1.

#### Type parameters:

Name | Default |
------ | ------ |
`A` | any |
`B` | any |

___

### Arity2

Ƭ  **Arity2**\<A, B, C>: (a: A, b: B) => C

*Defined in [src/common/types.ts:19](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L19)*

A type-level helper for functions with an arity of 2.

#### Type parameters:

Name | Default |
------ | ------ |
`A` | any |
`B` | any |
`C` | any |

___

### Arity3

Ƭ  **Arity3**\<A, B, C, D>: (a: A, b: B, c: C) => D

*Defined in [src/common/types.ts:24](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L24)*

A type-level helper for functions with an arity of 3.

#### Type parameters:

Name | Default |
------ | ------ |
`A` | any |
`B` | any |
`C` | any |
`D` | any |

___

### Arity4

Ƭ  **Arity4**\<A, B, C, D, E>: (a: A, b: B, c: C, d: D) => E

*Defined in [src/common/types.ts:29](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L29)*

A type-level helper for functions with an arity of 4.

#### Type parameters:

Name | Default |
------ | ------ |
`A` | any |
`B` | any |
`C` | any |
`D` | any |
`E` | any |

___

### Arity5

Ƭ  **Arity5**\<A, B, C, D, E, F>: (a: A, b: B, c: C, d: D, e: E) => F

*Defined in [src/common/types.ts:34](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L34)*

A type-level helper for functions with an arity of 5.

#### Type parameters:

Name | Default |
------ | ------ |
`A` | any |
`B` | any |
`C` | any |
`D` | any |
`E` | any |
`F` | any |

___

### Equals

Ƭ  **Equals**\<A, B>: [A] *extends* [B] ? [B] *extends* [A] ? true : false : false

*Defined in [src/common/types.ts:45](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L45)*

A type-level helper for checking for strict equality between types.

#### Type parameters:

Name |
------ |
`A` |
`B` |

___

### HeadArg

Ƭ  **HeadArg**\<A>: ArgsOf\<A>[0]

*Defined in [src/common/types.ts:9](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L9)*

Extract the first argument from a Function type.

#### Type parameters:

Name |
------ |
`A` |

___

### IsNever

Ƭ  **IsNever**\<A>: [Equals](_common_types_.md#equals)\<A, never>

*Defined in [src/common/types.ts:50](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L50)*

Check if a value is strictly equal to never

#### Type parameters:

Name |
------ |
`A` |

___

### IsUnknown

Ƭ  **IsUnknown**\<A>: [Equals](_common_types_.md#equals)\<A, unknown>

*Defined in [src/common/types.ts:55](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L55)*

Check if a value is strictly equal to unknown

#### Type parameters:

Name |
------ |
`A` |

___

### NoInfer

Ƭ  **NoInfer**\<T>: [T][T *extends* any ? 0 : never]

*Defined in [src/common/types.ts:62](https://github.com/TylorS/typed-fp/blob/f129829/src/common/types.ts#L62)*

Use TS laziness to avoid inference in a particular function argument.

**`example`** 
function foo<A>(value: NoInfer<A>, fn:(inferFromHere: A) => void) { ... }

#### Type parameters:

Name |
------ |
`T` |
