**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "io/TypedSchema"

# Module: "io/TypedSchema"

## Index

### Interfaces

* [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)

### Type aliases

* [TypeOf](_io_typedschema_.md#typeof)

### Functions

* [createSchema](_io_typedschema_.md#createschema)

## Type aliases

### TypeOf

Ƭ  **TypeOf**\<A>: ReturnType\<A> *extends* HKT\<any, *infer* R> ? R : ReturnType\<A> *extends* Kind\<any, *infer* R> ? R : ReturnType\<A> *extends* Kind2\<any, any, *infer* R> ? R : never

*Defined in [src/io/TypedSchema.ts:15](https://github.com/TylorS/typed-fp/blob/6ccb290/src/io/TypedSchema.ts#L15)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Fn](_lambda_exports_.md#fn) |

## Functions

### createSchema

▸ `Const`**createSchema**\<A>(`schema`: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<A>): [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<A>

*Defined in [src/io/TypedSchema.ts:26](https://github.com/TylorS/typed-fp/blob/6ccb290/src/io/TypedSchema.ts#L26)*

Create a TypedSchema

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`schema` | [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<A> |

**Returns:** [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<A>
