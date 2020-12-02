**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "lambda/exports"

# Module: "lambda/exports"

## Index

### Interfaces

* [Curry2](../interfaces/_lambda_exports_.curry2.md)
* [Curry3](../interfaces/_lambda_exports_.curry3.md)
* [Curry4](../interfaces/_lambda_exports_.curry4.md)
* [Curry5](../interfaces/_lambda_exports_.curry5.md)

### Type aliases

* [Curry](_lambda_exports_.md#curry)
* [Fn](_lambda_exports_.md#fn)

### Functions

* [always](_lambda_exports_.md#always)
* [curriedN](_lambda_exports_.md#curriedn)
* [curry](_lambda_exports_.md#curry)
* [memoize](_lambda_exports_.md#memoize)

## Type aliases

### Curry

Ƭ  **Curry**\<T>: ArgsOf\<T> *extends* [*infer* A] ? Arity1\<A, ReturnType\<T>> : ArgsOf\<T> *extends* [*infer* A, *infer* B] ? Curry2\<A, B, ReturnType\<T>> : ArgsOf\<T> *extends* [*infer* A, *infer* B, *infer* C] ? Curry3\<A, B, C, ReturnType\<T>> : ArgsOf\<T> *extends* [*infer* A, *infer* B, *infer* C, *infer* D] ? Curry4\<A, B, C, D, ReturnType\<T>> : ArgsOf\<T> *extends* [*infer* A, *infer* B, *infer* C, *infer* D, *infer* E] ? Curry5\<A, B, C, D, E, ReturnType\<T>> : ArgsOf\<T> *extends* never[] ? IO\<ReturnType\<T>> : never

*Defined in [src/lambda/exports.ts:54](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/lambda/exports.ts#L54)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [Fn](_lambda_exports_.md#fn) |

___

### Fn

Ƭ  **Fn**\<Args, R>: FunctionN\<Args, R>

*Defined in [src/lambda/exports.ts:32](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/lambda/exports.ts#L32)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`Args` | readonly any[] | readonly any[] |
`R` | - | any |

## Functions

### always

▸ `Const`**always**\<A>(`value`: A): (Anonymous function)

*Defined in [src/lambda/exports.ts:69](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/lambda/exports.ts#L69)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |

**Returns:** (Anonymous function)

___

### curriedN

▸ **curriedN**\<Args, R>(`arity`: number, `f`: [Fn](_lambda_exports_.md#fn)\<Args, R>, `previousArgs`: unknown[]): unknown

*Defined in [src/lambda/exports.ts:16](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/lambda/exports.ts#L16)*

#### Type parameters:

Name | Type |
------ | ------ |
`Args` | unknown[] |
`R` | - |

#### Parameters:

Name | Type |
------ | ------ |
`arity` | number |
`f` | [Fn](_lambda_exports_.md#fn)\<Args, R> |
`previousArgs` | unknown[] |

**Returns:** unknown

___

### curry

▸ `Const`**curry**\<F>(`f`: F): [Curry](_lambda_exports_.md#curry)\<F>

*Defined in [src/lambda/exports.ts:12](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/lambda/exports.ts#L12)*

Allow a fixed length function to be partially applied.

#### Type parameters:

Name | Type |
------ | ------ |
`F` | [Fn](_lambda_exports_.md#fn) |

#### Parameters:

Name | Type |
------ | ------ |
`f` | F |

**Returns:** [Curry](_lambda_exports_.md#curry)\<F>

___

### memoize

▸ `Const`**memoize**\<Args>(`eq`: Eq\<Args>): (Anonymous function)

*Defined in [src/lambda/exports.ts:71](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/lambda/exports.ts#L71)*

#### Type parameters:

Name | Type |
------ | ------ |
`Args` | readonly any[] |

#### Parameters:

Name | Type |
------ | ------ |
`eq` | Eq\<Args> |

**Returns:** (Anonymous function)
