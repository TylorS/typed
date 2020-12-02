**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["io/TypedSchema"](../modules/_io_typedschema_.md) / TypedSchema

# Interface: TypedSchema\<A>

A io-ts Schema type using TypedSchemable to include additional types.

## Type parameters

Name |
------ |
`A` |

## Hierarchy

* **TypedSchema**

## Callable

▸ \<S>(`schemable`: [TypedSchemable](_io_typedschemable_.typedschemable.md)\<S>): HKT\<S, A>

*Defined in [src/io/TypedSchema.ts:10](https://github.com/TylorS/typed-fp/blob/6ccb290/src/io/TypedSchema.ts#L10)*

A io-ts Schema type using TypedSchemable to include additional types.

#### Type parameters:

Name |
------ |
`S` |

#### Parameters:

Name | Type |
------ | ------ |
`schemable` | [TypedSchemable](_io_typedschemable_.typedschemable.md)\<S> |

**Returns:** HKT\<S, A>
