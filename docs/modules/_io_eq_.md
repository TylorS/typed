**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "io/Eq"

# Module: "io/Eq"

## Index

### Functions

* [tryEq](_io_eq_.md#tryeq)

### Object literals

* [Schemable](_io_eq_.md#schemable)

## Functions

### tryEq

▸ **tryEq**\<A>(`a`: A, `b`: A): (Anonymous function)

*Defined in [src/io/Eq.ts:48](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/io/Eq.ts#L48)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`a` | A |
`b` | A |

**Returns:** (Anonymous function)

## Object literals

### Schemable

▪ `Const` **Schemable**: object

*Defined in [src/io/Eq.ts:18](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/io/Eq.ts#L18)*

A TypedSchemable instance for Eqs

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`bigint` | Eq\<unknown> | eqStrict |
`date` | Eq\<Date> | eqDate |
`either` | getEq | E.getEq |
`int` | Eq\<number> | eqNumber |
`json` | Eq\<unknown> | deepEqualsEq |
`jsonArray` | Eq\<unknown> | deepEqualsEq |
`jsonPrimitive` | Eq\<unknown> | deepEqualsEq |
`jsonRecord` | Eq\<unknown> | deepEqualsEq |
`map` | getEq | RM.getEq |
`never` | Eq\<unknown> | eqStrict |
`option` | getEq | O.getEq |
`propertyKey` | Eq\<unknown> | eqStrict |
`remoteData` | getEq | RD.getEq |
`set` | getEq | RS.getEq |
`symbol` | Eq\<unknown> | eqStrict |
`unknown` | Eq\<unknown> | eqStrict |
`uuid` | Eq\<unknown> | eqStrict |
`newtype` | function | \<A>(from: Eq\<CarrierOf\<A>>, refine: [Match](_logic_types_.match.md)\<CarrierOf\<A>, A>, id: string) => Eq\<A> |
`refine` | function | (refinement: (a: A) => a is B, id: string) => (from: Kind\<S, A>) => Kind\<S, B> |
`union` | function | (...eqs: {}) => { equals: (a: A[number], b: A[number]) => boolean  } |
